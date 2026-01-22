import { DLQ_KEY } from "../constants";
import type RedisClient from "./redis";

/**
 * Starts a Dead Letter Queue (DLQ) processor that continuously monitors and retries failed messages.
 *
 * This function runs an infinite loop that:
 * - Polls the DLQ for failed messages every 30 seconds
 * - Parses each message and extracts the userId
 * - Republishes the message to the user's notification channel
 * - Logs successful retries
 * - Catches and logs any processing errors
 *
 * @param redis - The Redis client instance used to interact with Redis for message operations
 * @returns A Promise that never resolves (infinite loop)
 *
 * @example
 * ```typescript
 * const redis = new RedisClient();
 * DLQ(redis); // Starts the processor
 * ```
 *
 * @remarks
 * - The function runs indefinitely and should typically be started in a separate process or worker thread
 * - Messages are expected to have a JSON structure with at least `userId` and `id` properties
 * - Failed messages are retried on the notification channel: `notifications:{userId}`
 * - Errors are logged but do not stop the processor
 */

// ! HERE POLLING TIME IS SET TO 30 SECONDS TO AVOID RATE LIMITING ISSUES WITH PUB/SUB IN UPSTASH REDIS
export async function DLQ(redis: RedisClient) {
  while (true) {
    try {
      const message = await redis.lPop(DLQ_KEY);
      if (message) {
        const parsed = JSON.parse(message);
        const userId = parsed.userId;
        await redis.publish(`notifications:${userId}`, message);
        console.log("Retried DLQ message:", parsed.id);
      }
    } catch (err) {
      console.error("DLQ processing failed:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
}
