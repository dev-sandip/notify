import { useState, useEffect } from "react";
import { useSocket } from "../hooks/useSocket";
import type { Notification } from "../types";

export const UserPage = () => {
  const [userId, setUserId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { connected, notifications, connect, disconnect } = useSocket(
    isLoggedIn ? userId : null,
  );

  useEffect(() => {
    if (isLoggedIn && userId) {
      connect();
    }
  }, [isLoggedIn, userId, connect]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      return;
    }
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    disconnect();
    setIsLoggedIn(false);
    setUserId("");
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">User Login</h2>
            <p className="text-slate-600 mt-2">
              Enter your user ID to receive notifications
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Welcome, {userId}!
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    connected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-slate-600">
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            Your Notifications
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({notifications.length})
            </span>
          </h3>
          <div className="space-y-3 max-h-150 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p>No notifications yet</p>
                <p className="text-sm mt-2">
                  You'll see notifications here when they arrive
                </p>
              </div>
            ) : (
              notifications.map((notif: Notification) => (
                <div
                  key={notif.id}
                  className={`p-4 border rounded-lg ${getNotificationColor(
                    notif.type,
                  )} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-600">
                      {notif.type}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{notif.message}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    ID: {notif.id.slice(0, 8)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
