import { SettingsView } from "@/components/portal/SettingsView";

export const metadata = {
  title: "Account Settings · Settly Buyer Portal",
  description: "Manage your personal profile, credentials, and authentication on Settly.",
};

export default function BuyerSettingsPage() {
  return <SettingsView portal="buyer" />;
}
