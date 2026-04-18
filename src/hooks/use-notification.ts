import { toast } from "sonner";
import { useNotificationStore } from "@/stores/notificationStore";

type NotifyType = "success" | "error" | "warning" | "info";

export function useNotification() {
  const addNotification = useNotificationStore((s) => s.addNotification);

  function getTitle(type: NotifyType) {
    switch (type) {
      case "success":
        return "Berhasil";
      case "error":
        return "Terjadi Kesalahan";
      case "warning":
        return "Peringatan";
      default:
        return "Informasi";
    }
  }

  function notify(type: NotifyType, message: string) {
    const normalizedMessage = message?.trim() || "Terjadi kesalahan yang tidak diketahui";

    switch (type) {
      case "success":
        toast.success(normalizedMessage);
        break;
      case "error":
        toast.error(normalizedMessage);
        break;
      case "warning":
        toast.warning(normalizedMessage);
        break;
      default:
        toast.info(normalizedMessage);
        break;
    }

    addNotification({
      title: getTitle(type),
      description: normalizedMessage,
      time: "Baru saja",
      type,
    });
  }

  return { notify };
}
