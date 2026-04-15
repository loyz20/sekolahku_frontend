import { toast } from "sonner";

type NotifyType = "success" | "error" | "warning" | "info";

export function useNotification() {
  function notify(type: NotifyType, message: string) {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "warning":
        toast.warning(message);
        break;
      default:
        toast.info(message);
        break;
    }
  }

  return { notify };
}
