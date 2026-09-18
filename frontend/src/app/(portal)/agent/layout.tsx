import { PortalShell } from "@/components/portal/PortalShell";

export default function AgentPortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell portal="agent">{children}</PortalShell>;
}
