import { SettingsView } from "@/components/portal/SettingsView";

export const metadata = {
  title: "Account & Brokerage Credentials · Settly Agent Portal",
  description: "Manage your agent credentials, Egyptian license records, and security on Settly.",
};

export default function AgentSettingsPage() {
  return <SettingsView portal="agent" />;
}
