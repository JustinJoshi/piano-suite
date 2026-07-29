import { Sidebar } from "@/components/tools/sidebar";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative z-10 min-h-screen bg-transparent">
      <Sidebar />
      <div className="dashboard-main flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
