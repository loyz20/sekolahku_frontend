import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";

export function DashboardLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-hidden bg-transparent">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_0%,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(34,197,94,0.12),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(249,115,22,0.13),transparent_42%)]" />
            <div className="absolute -top-24 right-6 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" />
            <div className="absolute bottom-0 left-16 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
          </div>

          <Topbar />
          <main className="relative flex-1 overflow-auto p-4 md:p-6">
            <div className="mx-auto w-full max-w-[1600px]">
              <div className="app-shell-glass p-4 md:p-6">
                <Outlet />
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
