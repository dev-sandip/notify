import express, { json } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import morgan from "morgan";
import cors from "cors";
import RedisClient from "./lib/redis";
import { DLQ_KEY } from "./constants";
import { randomUUID } from "node:crypto";

const app = express();
const PORT = 8080;
app.use(cors());
app.use(morgan("combined"));
app.use(json());

const redis = new RedisClient();
const server = createServer(app);
await redis.connect();

const io = new Server(server, {
  cors: {
    origin: "*", //TODO: May be i will change this url to prod url later
    methods: ["GET", "POST"],
  },
});

const subscribedUsers = new Set<string>(); // FOR TRACKING SUBSCRIBED USERS

io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id);
  const userId = socket.handshake.query.userId as string;
  // ! MUST VALIDATE userId BEFORE ALLOWING CONNECTION
  if (!userId) {
    socket.disconnect();
    return;
  }
  socket.join(`user:${userId}`);
  if (!subscribedUsers.has(userId)) {
    await redis.subscribe(`notifications:${userId}`, (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        io.to(`user:${userId}`).emit("notification", parsedMessage);
      
      } catch (err) {
        console.error("Failed to process notification:", err);
        redis.rPush(DLQ_KEY, message);
      }
    });
    subscribedUsers.add(userId);
  }

  socket.on("ack", async (msgId: string) => {
    //  User sent ack for received message
    console.log(`Ack received for msg ${msgId} from user ${userId}`);
  });

  socket.on("disconnect", async () => {
    console.log("A user disconnected:", socket.id);
    const roomSize = io.sockets.adapter.rooms.get(`user:${userId}`)?.size || 0;
    if (roomSize === 0 && subscribedUsers.has(userId)) {
      await redis.unsubscribe(`notifications:${userId}`);
      subscribedUsers.delete(userId);
    }
  });
});

app.post("/publish", async (req, res) => {
  const { userId, type, message, timestamp } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: "Missing userId or message" });
  }

  const notification = JSON.stringify({
    id: randomUUID(),
    userId,
    type,
    message,
    timestamp: timestamp || new Date().toISOString(),
  });

  try {
    // Publish to user-specific channel
    await redis.publish(`notifications:${userId}`, notification);
    console.log(`notifications has been published to ${userId}`)
    res.json({ status: "published" });
  } catch (err) {
    console.error("Publish failed:", err);
    // Push to DLQ on publish failure (though rare)
    await redis.rPush(DLQ_KEY, notification);
    res.status(500).json({ error: "Publish failed" });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
