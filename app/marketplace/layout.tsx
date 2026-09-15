import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";

export default function MarketplaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
