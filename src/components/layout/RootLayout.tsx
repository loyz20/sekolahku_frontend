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
        <SidebarInset className="overflow-hidden bg-slate-50">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.14),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(249,115,22,0.10),transparent_40%)]" />
            <div className="absolute -top-20 right-10 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute bottom-0 left-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
          </div>

          <Topbar />
          <main className="relative flex-1 overflow-auto p-4 md:p-6">
            <div className="mx-auto w-full max-w-[1600px]">
              <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.3)] backdrop-blur-md md:p-6">
                <Outlet />
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
