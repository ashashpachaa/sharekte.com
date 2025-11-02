import { useState } from "react";
import { Bell, X, CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";
import { useNotifications } from "@/lib/notifications-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, removeNotification } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    // Remove notification after 300ms (smooth UX)
    setTimeout(() => {
      removeNotification(id);
    }, 300);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800";
      case "info":
      default:
        return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-border/40 hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-background border border-border/40 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-96">
                <div className="divide-y divide-border/40">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(notification.timestamp, {
                                addSuffix: true,
                              })}
                            </span>
                            {notification.action && (
                              <button className="text-xs text-primary hover:underline">
                                {notification.action.label}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="flex gap-2 p-4 border-t border-border/40 bg-muted/30">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={markAllAsRead}
                    className="flex-1"
                  >
                    Mark all as read
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearAll}
                  className="flex-1 text-destructive hover:bg-destructive/10"
                >
                  Clear all
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
