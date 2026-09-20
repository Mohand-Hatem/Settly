import { NotificationsFeed } from "@/components/notifications/NotificationsFeed";

export const metadata = {
  title: "Notifications · Settly Admin Governance",
  description: "Platform alerts, listing moderation events, and security notifications.",
};

export default function AdminNotificationsPage() {
  return <NotificationsFeed portal="admin" />;
}
