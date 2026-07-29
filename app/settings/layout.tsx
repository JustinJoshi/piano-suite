import { DashboardShell } from "@/components/tools/dashboard-shell";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell showMobileTopBar>{children}</DashboardShell>;
}
