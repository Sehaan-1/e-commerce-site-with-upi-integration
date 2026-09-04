import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</main>
      <SiteFooter />
    </>
  );
}
