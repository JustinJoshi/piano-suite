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
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
