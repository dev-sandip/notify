import { createClient, type RedisClientType } from "redis";
import { config } from "dotenv";
config();

/**
 * RedisClient
 *
 * A wrapper class for interacting with Redis using the node-redis library.
 * Provides methods for basic key-value operations, pub/sub messaging, and list operations.
 *
 * @class RedisClient
 *
 * @example
 * ```typescript
 * const redis = new RedisClient();
 * await redis.connect();
 * await redis.set('key', 'value', 3600);
 * const value = await redis.get('key');
 * await redis.destroy();
 * ```
 */
class RedisClient {
  private client: RedisClientType;
  private subscriber: RedisClientType;

  constructor(url: string = process.env.REDIS_URL!) {
    this.client = createClient({ url });
    this.subscriber = this.client.duplicate();
    this.client.on("error", (err) => {
      console.error("Redis client error:", err);
    });
    this.subscriber.on("error", (err) => {
      console.error("Redis subscriber error:", err);
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    await this.subscriber.connect();
    console.log("Connected to Redis");
  }

  async destroy(): Promise<void> {
    this.client.destroy();
    this.subscriber.destroy();
    console.log("Disconnected from Redis");
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async publish(channel: string, message: string): Promise<number> {
    return await this.client.publish(channel, message);
  }

  async subscribe(
    channel: string,
    handler: (message: string, channel: string) => void,
  ): Promise<void> {
    await this.subscriber.subscribe(channel, handler);
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  async rPush(key: string, value: string): Promise<number> {
    return await this.client.rPush(key, value);
  }

  async lPop(key: string): Promise<string | null> {
    return await this.client.lPop(key);
  }

  async lLen(key: string): Promise<number> {
    return await this.client.lLen(key);
  }
}

export default RedisClient;
