import { NotificationsFeed } from "@/components/notifications/NotificationsFeed";

export const metadata = {
  title: "Notifications · Settly Buyer Portal",
  description: "Real-time updates on viewings, offer negotiations, reservation deposits, and account activity.",
};

export default function BuyerNotificationsPage() {
  return <NotificationsFeed portal="buyer" />;
}
