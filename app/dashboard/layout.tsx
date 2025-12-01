import type { ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/sidebar";
import { Navbar } from "./components/navbar";

interface DashboardLayoutProps {
  readonly children: ReactNode;
}

export default function Layout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col">
        <Navbar />
        <div className="p-4">{children}</div>
      </main>
    </SidebarProvider>
  );
}

