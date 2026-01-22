import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import type { Notification } from "../types";

const SOCKET_URL = "http://localhost:8080";

export const useSocket = (userId: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const connect = useCallback(() => {
    if (!userId?.trim()) {
      toast.error("User ID is required");
      return;
    }

    const newSocket = io(SOCKET_URL, {
      query: { userId: userId.trim() },
    });

    newSocket.on("connect", () => {
      setConnected(true);
      toast.success(`Connected as ${userId}`);
    });

    newSocket.on("notification", (data: Notification) => {
      setNotifications((prev) => [data, ...prev]);
      toast.success(`New notification: ${data.message}`);
      // Send acknowledgment
      newSocket.emit("ack", data.id);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
      toast.error("Disconnected from server");
    });

    newSocket.on("connect_error", (error) => {
      toast.error("Connection failed");
      console.error("Connection error:", error);
    });

    setSocket(newSocket);
  }, [userId]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnected(false);
      setNotifications([]);
      toast.success("Disconnected");
    }
  }, [socket]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return {
    socket,
    connected,
    notifications,
    connect,
    disconnect,
  };
};
