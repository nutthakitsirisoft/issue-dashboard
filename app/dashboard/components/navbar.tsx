import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";

export function Navbar() {
  return (
    <header className="bg-background/90 sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-1 px-4 py-2 lg:gap-2">
        <div className="flex items-center gap-1">
          <SidebarTrigger />
          <h1 className="text-base font-medium">JIRA Summary Defect</h1>
        </div>
        <ModeToggle />
      </div>
    </header>
  );
}

