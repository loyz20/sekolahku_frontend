import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2, X } from "lucide-react";
import {
  useNotificationStore,
  type Notification,
} from "@/stores/notificationStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const typeIcon: Record<Notification["type"], typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColor: Record<Notification["type"], string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-amber-500",
  error: "text-red-500",
};

export function NotificationPopover() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } =
    useNotificationStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full border border-slate-200/70 bg-white/70 shadow-sm hover:bg-white">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-0.5 -right-0.5 inline-flex size-2 rounded-full bg-red-500 ring-2 ring-white" />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
              >
              {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            </>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 overflow-hidden border-slate-200/70 bg-white/95 p-0 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-200/70 bg-slate-50/80 px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Notifikasi</h4>
            <p className="text-[11px] text-slate-500">{unreadCount} belum dibaca</p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto rounded-md px-2 py-1 text-xs"
              onClick={markAllAsRead}
            >
              <Check className="mr-1 size-3" />
              Tandai semua dibaca
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="mb-2 size-8 opacity-40" />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="flex flex-col p-2">
              {notifications.map((notification) => {
                const Icon = typeIcon[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative mb-1 flex gap-3 rounded-lg border border-transparent px-3 py-3 transition-all hover:border-slate-200 hover:bg-slate-50/80",
                      !notification.read && "border-slate-200/70 bg-slate-100/70"
                    )}
                  >
                    <div className={cn("mt-0.5 shrink-0", typeColor[notification.type])}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-tight",
                            !notification.read && "font-medium"
                          )}
                        >
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="shrink-0 rounded-md opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => removeNotification(notification.id)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {notification.time}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto rounded-md px-1.5 py-0.5 text-[11px]"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Tandai dibaca
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && <Separator />}
      </PopoverContent>
    </Popover>
  );
}
