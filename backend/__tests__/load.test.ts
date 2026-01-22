import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { io, Socket } from "socket.io-client";
import { faker } from "@faker-js/faker";
import { performance } from "perf_hooks";

describe("Notification System Load Test - 200 Users", () => {
  const SERVER_URL: string = "http://localhost:8080";
  const NUM_USERS: number = 200;
  const TEST_DURATION_MS: number = 60000; // 60 seconds
  const NOTIFICATIONS_PER_USER: number = 10; // Send 10 notifications per user during test
  
  let clients: Array<{ socket: Socket; userId: string }> = [];
  let metrics = {
    connections: { successful: 0, failed: 0, avgTime: 0, times: [] as number[] },
    notificationsReceived: 0,
    acksSent: 0,
    latencies: [] as number[],
    errors: 0,
    publishedCount: 0,
  };

  beforeAll(async () => {
    console.log(`🚀 Starting connection of ${NUM_USERS} concurrent users...`);
    const connectionPromises: Promise<void>[] = [];

    for (let i = 0; i < NUM_USERS; i++) {
      const userId: string = faker.string.uuid();
      const startTime: number = performance.now();

      const promise = new Promise<void>((resolve, reject) => {
        const socket: Socket = io(SERVER_URL, {
          query: { userId },
          reconnection: false,
          timeout: 10000,
        });

        socket.on("connect", () => {
          const connectTime: number = performance.now() - startTime;
          metrics.connections.successful++;
          metrics.connections.times.push(connectTime);
          metrics.connections.avgTime =
            metrics.connections.times.reduce((a, b) => a + b, 0) /
            metrics.connections.times.length;

          // Listen for notifications
          socket.on("notification", (data: any) => {
            const receiveTime: number = performance.now();
            
            // Calculate latency if sentTimestamp exists
            if (data.sentTimestamp && typeof data.sentTimestamp === 'number') {
              const latency: number = receiveTime - data.sentTimestamp;
              metrics.latencies.push(latency);
            }
            
            metrics.notificationsReceived++;

            // Send acknowledgment
            socket.emit("ack", data.id);
            metrics.acksSent++;
          });

          socket.on("error", (err: Error) => {
            metrics.errors++;
            console.error(`Socket error for user ${userId}:`, err.message);
          });

          clients.push({ socket, userId });
          resolve();
        });

        socket.on("connect_error", (err: Error) => {
          metrics.connections.failed++;
          console.error(`Connection failed for user ${i}:`, err.message);
          reject(err);
        });

        socket.on("connect_timeout", () => {
          metrics.connections.failed++;
          reject(new Error("Connection timeout"));
        });
      });

      connectionPromises.push(promise);
    }

    // Wait for all connections
    const results = await Promise.allSettled(connectionPromises);
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`✅ Connected: ${successful}, ❌ Failed: ${failed}`);
  }, 60000); // Longer timeout for 200 connections

  test("All users connect successfully", () => {
    expect(metrics.connections.successful).toBe(NUM_USERS);
    expect(metrics.connections.failed).toBe(0);
    
    const minTime = Math.min(...metrics.connections.times);
    const maxTime = Math.max(...metrics.connections.times);
    const p95Time = metrics.connections.times.sort((a, b) => a - b)[
      Math.floor(metrics.connections.times.length * 0.95)
    ];

    console.log(`\n📊 Connection Metrics:`);
    console.log(`   Average: ${metrics.connections.avgTime.toFixed(2)} ms`);
    console.log(`   Min: ${minTime.toFixed(2)} ms`);
    console.log(`   Max: ${maxTime.toFixed(2)} ms`);
    console.log(`   P95: ${p95Time.toFixed(2)} ms`);
  });

  test("System handles notifications under load", async () => {
    console.log(`\n🔔 Publishing ${NOTIFICATIONS_PER_USER} notifications per user...`);
    
    const publishPromises: Promise<void>[] = [];
    
    // Publish notifications to all users
    for (const { userId } of clients) {
      for (let i = 0; i < NOTIFICATIONS_PER_USER; i++) {
        const promise = (async () => {
          try {
            const sentTimestamp = performance.now();
            const response = await fetch(`${SERVER_URL}/publish`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                type: "test_notification",
                message: `Test message ${i + 1} for load testing`,
                timestamp: new Date().toISOString(),
                sentTimestamp, // Include for latency calculation
              }),
            });

            if (response.ok) {
              metrics.publishedCount++;
            } else {
              console.error(`Failed to publish to ${userId}:`, await response.text());
            }
          } catch (err) {
            console.error(`Publish error for ${userId}:`, err);
          }
        })();

        publishPromises.push(promise);
        
        // Stagger requests slightly to avoid overwhelming the server
        if (publishPromises.length % 50 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    // Wait for all publishes
    await Promise.all(publishPromises);
    console.log(`✅ Published ${metrics.publishedCount} notifications`);

    // Wait for notifications to be received
    console.log(`⏳ Waiting for notifications to be delivered...`);
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 second buffer

    // Calculate statistics
    const expectedNotifications = NUM_USERS * NOTIFICATIONS_PER_USER;
    const deliveryRate = (metrics.notificationsReceived / expectedNotifications) * 100;
    
    // Only calculate latency stats if we have latency data
    let avgLatency = 0;
    let p50Latency = 0;
    let p95Latency = 0;
    let p99Latency = 0;
    let maxLatency = 0;

    if (metrics.latencies.length > 0) {
      avgLatency = metrics.latencies.reduce((sum, lat) => sum + lat, 0) / metrics.latencies.length;
      const sortedLatencies = [...metrics.latencies].sort((a, b) => a - b);
      p50Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)];
      p95Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)];
      p99Latency = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)];
      maxLatency = Math.max(...metrics.latencies);
    }

    console.log(`\n📊 Notification Metrics:`);
    console.log(`   Expected: ${expectedNotifications}`);
    console.log(`   Received: ${metrics.notificationsReceived}`);
    console.log(`   Delivery Rate: ${deliveryRate.toFixed(2)}%`);
    console.log(`   Acks Sent: ${metrics.acksSent}`);
    console.log(`   Errors: ${metrics.errors}`);
    
    if (metrics.latencies.length > 0) {
      console.log(`\n⏱️  Latency Metrics:`);
      console.log(`   Average: ${avgLatency.toFixed(2)} ms`);
      console.log(`   P50: ${p50Latency.toFixed(2)} ms`);
      console.log(`   P95: ${p95Latency.toFixed(2)} ms`);
      console.log(`   P99: ${p99Latency.toFixed(2)} ms`);
      console.log(`   Max: ${maxLatency.toFixed(2)} ms`);
    } else {
      console.log(`\n⚠️  No latency data collected (sentTimestamp not in notifications)`);
    }

    // Assertions - adjust thresholds based on your requirements
    expect(metrics.notificationsReceived).toBeGreaterThan(0);
    expect(deliveryRate).toBeGreaterThan(95); // At least 95% delivery rate
    
    // Only test latency if we have data
    if (metrics.latencies.length > 0) {
      expect(avgLatency).toBeLessThan(200); // Average latency under 200ms
      expect(p95Latency).toBeLessThan(500); // P95 latency under 500ms
    }
    
    expect(metrics.acksSent).toBe(metrics.notificationsReceived);
  }, 120000); // 2 minute timeout for the test

  afterAll(() => {
    console.log(`\n🧹 Cleaning up ${clients.length} connections...`);
    clients.forEach(({ socket }) => socket.disconnect());
    clients = [];
    console.log(`✅ Cleanup complete`);
  });
});
