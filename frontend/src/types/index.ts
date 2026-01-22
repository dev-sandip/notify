export interface Notification {
  id: string;
  userId: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: string;
}

export interface NotificationPayload {
  userId: string;
  type: string;
  message: string;
  timestamp?: string;
}
