import { useNotifications } from "@/lib/notifications-context";
import { toast } from "sonner";

export function useNotificationTriggers() {
  const { addNotification } = useNotifications();

  const triggerCompanyStatusChange = (companyName: string, status: string) => {
    addNotification({
      title: "Company Status Updated",
      message: `${companyName} status changed to ${status}`,
      type: "info",
      action: {
        label: "View Details",
        href: "/dashboard",
      },
    });
    toast.info(`${companyName} status updated to ${status}`);
  };

  const triggerPaymentConfirmation = (amount: number, invoiceNumber: string) => {
    addNotification({
      title: "Payment Confirmed",
      message: `Payment of £${amount.toLocaleString()} received for invoice ${invoiceNumber}`,
      type: "success",
      action: {
        label: "View Invoice",
        href: "/dashboard",
      },
    });
    toast.success(`Payment of £${amount.toLocaleString()} confirmed`);
  };

  const triggerRenewalReminder = (companyName: string, renewalDate: string) => {
    addNotification({
      title: "Renewal Due Soon",
      message: `${companyName} renewal is due on ${renewalDate}`,
      type: "warning",
      action: {
        label: "Renew Now",
        href: "/dashboard",
      },
    });
    toast.warning(`${companyName} renewal reminder`);
  };

  const triggerSupportResponse = (ticketId: string, message: string) => {
    addNotification({
      title: "Support Response",
      message: `New response to your support ticket #${ticketId}`,
      type: "info",
      action: {
        label: "View Message",
        href: "/support",
      },
    });
    toast.info("You have a new support response");
  };

  const triggerTransferFormApproved = (companyName: string) => {
    addNotification({
      title: "Transfer Form Approved",
      message: `Transfer form for ${companyName} has been approved. Ownership transfer in progress.`,
      type: "success",
      action: {
        label: "View Details",
        href: "/dashboard",
      },
    });
    toast.success(`${companyName} transfer form approved`);
  };

  const triggerTransferFormAmendRequired = (companyName: string, comments: string) => {
    addNotification({
      title: "Amendments Required",
      message: `Your transfer form for ${companyName} requires amendments. Check admin comments.`,
      type: "warning",
      action: {
        label: "View Comments",
        href: "/dashboard",
      },
    });
    toast.warning(`Amendments required for ${companyName}`);
  };

  const triggerTransferComplete = (companyName: string) => {
    addNotification({
      title: "Ownership Transfer Complete",
      message: `Congratulations! Ownership of ${companyName} has been successfully transferred to you.`,
      type: "success",
      action: {
        label: "View Company",
        href: "/dashboard",
      },
    });
    toast.success(`${companyName} ownership transfer complete`);
  };

  const triggerRenewalSuccess = (companyName: string) => {
    addNotification({
      title: "Renewal Completed",
      message: `${companyName} has been successfully renewed for another year.`,
      type: "success",
      action: {
        label: "View Details",
        href: "/dashboard",
      },
    });
    toast.success(`${companyName} renewal completed`);
  };

  const triggerError = (title: string, message: string) => {
    addNotification({
      title,
      message,
      type: "error",
    });
    toast.error(message);
  };

  return {
    triggerCompanyStatusChange,
    triggerPaymentConfirmation,
    triggerRenewalReminder,
    triggerSupportResponse,
    triggerTransferFormApproved,
    triggerTransferFormAmendRequired,
    triggerTransferComplete,
    triggerRenewalSuccess,
    triggerError,
  };
}
