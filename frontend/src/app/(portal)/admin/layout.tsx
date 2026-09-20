import { PortalShell } from "@/components/portal/PortalShell";

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell portal="admin">{children}</PortalShell>;
}
