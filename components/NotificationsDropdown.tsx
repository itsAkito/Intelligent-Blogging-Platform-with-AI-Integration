"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  post_id?: string;
  is_read: boolean;
  created_at: string;
  triggered_by_user?: {
    name: string;
    avatar_url?: string;
  };
}

export default function NotificationsDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/notifications?limit=10");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, isRead: true }),
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);

    // Route based on notification type
    if (notification.post_id) {
      router.push(`/blog/${notification.post_id}`);
    } else if (notification.type === "follow_request") {
      router.push("/dashboard/requests");
    } else if (notification.type === "follow") {
      router.push("/dashboard");
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return "favorite";
      case "comment":
        return "forum";
      case "follow":
        return "person_add";
      case "follow_request":
        return "person_add_question";
      case "mention":
        return "at";
      case "job_application":
        return "work";
      default:
        return "notifications";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white">
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-500 overflow-y-auto">
        <div className="px-4 py-3 flex items-center justify-between sticky top-0 bg-surface-container border-b border-outline-variant/10">
          <h3 className="font-bold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-on-surface-variant text-sm">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mx-auto block mb-2">
              notifications_none
            </span>
            <p className="text-sm text-on-surface-variant">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full px-4 py-3 text-left hover:bg-surface-container-low/50 transition-colors ${
                  !notification.is_read ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="shrink-0 mt-1">
                    <span
                      className={`material-symbols-outlined text-base ${
                        !notification.is_read ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="grow">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`font-semibold text-sm ${
                          !notification.is_read
                            ? "text-on-surface"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-on-surface-variant/60 mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />

        <button
          onClick={() => {
            router.push("/dashboard/notifications");
            setIsOpen(false);
          }}
          className="w-full px-4 py-2 text-center text-xs text-primary font-semibold hover:bg-primary/5 transition-colors"
        >
          View All Notifications
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
