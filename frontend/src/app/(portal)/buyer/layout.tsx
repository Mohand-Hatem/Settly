import { PortalShell } from "@/components/portal/PortalShell";

export default function BuyerPortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell portal="buyer">{children}</PortalShell>;
}
