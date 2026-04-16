import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 rounded-full border border-slate-200/70 bg-white/75 px-2 shadow-sm hover:bg-white"
        >
          <Avatar size="sm" className="ring-1 ring-slate-200">
            <AvatarFallback className="bg-slate-900 text-xs text-white">
              {user?.name ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-24 truncate text-xs font-medium text-slate-700 sm:inline">
            {user?.name || "Pengguna"}
          </span>
          <span className="sr-only">Menu pengguna</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 border-slate-200/70 bg-white/95 p-1 shadow-xl backdrop-blur-md">
        <DropdownMenuLabel className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-slate-900">{user?.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="rounded-md" onClick={() => navigate("/profil")}>
          <User className="mr-2 size-4" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-md" onClick={() => navigate("/pengaturan")}>
          <Settings className="mr-2 size-4" />
          Pengaturan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="rounded-md text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
