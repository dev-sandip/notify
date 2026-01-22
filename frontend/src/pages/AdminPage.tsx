import { useState } from "react";
import toast from "react-hot-toast";
import type { NotificationPayload } from "../types";

const API_URL = "http://localhost:8080";

export const AdminPage = () => {
  const [targetUserId, setTargetUserId] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">(
    "info",
  );
  const [sending, setSending] = useState(false);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetUserId.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);

    const payload: NotificationPayload = {
      userId: targetUserId,
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${API_URL}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Notification sent successfully!");
        setMessage("");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send notification");
      }
    } catch (error) {
      toast.error("Error sending notification");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const quickMessages = [
    { type: "info" as const, message: "New update available for your account" },
    { type: "success" as const, message: "Your order has been confirmed!" },
    { type: "warning" as const, message: "Please verify your email address" },
    { type: "error" as const, message: "Payment failed. Please try again" },
  ];

  const handleQuickSend = (quickType: typeof type, quickMessage: string) => {
    setType(quickType);
    setMessage(quickMessage);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Admin Dashboard
              </h1>
              <p className="text-slate-600">
                Send notifications to any user in real-time
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send Notification Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Send Notification
            </h2>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target User ID
                </label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Enter user ID"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notification Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["info", "success", "warning", "error"] as const).map(
                    (notifType) => (
                      <button
                        key={notifType}
                        type="button"
                        onClick={() => setType(notifType)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                          type === notifType
                            ? notifType === "info"
                              ? "bg-blue-600 text-white"
                              : notifType === "success"
                                ? "bg-green-600 text-white"
                                : notifType === "warning"
                                  ? "bg-yellow-600 text-white"
                                  : "bg-red-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {notifType}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message"
                  rows={4}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
                  sending
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send Notification"
                )}
              </button>
            </form>
          </div>

          {/* Quick Messages */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              Quick Messages
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Click to use a template message
            </p>
            <div className="space-y-3">
              {quickMessages.map((quick, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSend(quick.type, quick.message)}
                  className={`w-full text-left p-3 rounded-lg border-2 hover:shadow-md transition-all ${
                    quick.type === "info"
                      ? "border-blue-200 hover:border-blue-300 bg-blue-50"
                      : quick.type === "success"
                        ? "border-green-200 hover:border-green-300 bg-green-50"
                        : quick.type === "warning"
                          ? "border-yellow-200 hover:border-yellow-300 bg-yellow-50"
                          : "border-red-200 hover:border-red-300 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold uppercase text-slate-600">
                      {quick.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">{quick.message}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
