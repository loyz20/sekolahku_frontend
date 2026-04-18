import { useLocation, Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { sidebarNav } from "@/constants/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function normalizeRole(role: string | undefined | null) {
  return (role || "").toLowerCase().trim();
}

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const schoolName = useSettingsStore((s) => s.getString("school_name", "Sekolahku"));
  const schoolLevel = useSettingsStore((s) => s.getString("school_level", "Sistem Informasi Sekolah"));
  const logoUrl = useSettingsStore((s) => s.getString("school_logo_url"));

  const userRoles = new Set<string>([
    ...(user?.duties || []).map((d) => normalizeRole(d)),
    normalizeRole(user?.primaryRole),
  ]);

  const filteredSidebarNav = sidebarNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        return item.roles.some((role) => userRoles.has(normalizeRole(role)));
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" variant="floating" className="border-0">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-15 rounded-2xl border border-sidebar-border/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(240,249,255,0.85))] px-3 shadow-[0_12px_28px_-20px_rgba(2,132,199,0.45)]"
            >
              <Link to="/">
                {logoUrl ? (
                  <Avatar size="sm" className="rounded-lg ring-1 ring-sidebar-border/70">
                    <AvatarImage src={logoUrl} alt={schoolName} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      <GraduationCap className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <GraduationCap className="size-4" />
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight text-slate-900">{schoolName}</span>
                  <span className="truncate text-xs text-muted-foreground/90">
                    {schoolLevel}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1 pb-2">
        {filteredSidebarNav.map((group) => (
          <SidebarGroup key={group.label} className="px-2 py-1">
            <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.12em] text-sidebar-foreground/55">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-9 rounded-xl px-2.5 text-sidebar-foreground/90 transition-all hover:bg-sidebar-accent/85 hover:translate-x-0.5 data-[active=true]:bg-[linear-gradient(140deg,rgba(14,165,233,0.95),rgba(34,197,94,0.85))] data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_10px_22px_-14px_rgba(2,132,199,0.65)]"
                      >
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge className="rounded-full bg-sidebar-primary/15 px-1.5 text-[10px] text-sidebar-primary">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 pt-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-14 rounded-2xl border border-sidebar-border/70 bg-white/80 px-3"
            >
              <Link to="/profil">
                <Avatar size="sm" className="ring-1 ring-sidebar-border/70">
                  <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs capitalize text-muted-foreground/90">
                    {user?.primaryRole}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
