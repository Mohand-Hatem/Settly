import { NotificationsFeed } from "@/components/notifications/NotificationsFeed";

export const metadata = {
  title: "Notifications · Settly Agent Portal",
  description: "Real-time updates on client viewing requests, incoming purchase offers, and deposit status.",
};

export default function AgentNotificationsPage() {
  return <NotificationsFeed portal="agent" />;
}
