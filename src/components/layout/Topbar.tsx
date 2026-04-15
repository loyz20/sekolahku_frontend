import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { NotificationPopover } from "./NotificationPopover";
import { UserMenu } from "./UserMenu";
import { useSettingsStore } from "@/stores/settingsStore";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/siswa": "Siswa",
  "/guru": "Guru",
  "/mapel": "Mata Pelajaran",
  "/jadwal": "Jadwal Pembelajaran",
  "/jadwal/class-subjects": "Manajemen Mapel Kelas",
  "/jadwal/teaching-assignments": "Manajemen Penugasan Guru",
  "/nilai": "Nilai",
  "/pengguna": "Manajemen Pengguna",
  "/tugas": "Manajemen Tugas",
  "/kelas": "Manajemen Kelas",
  "/profil": "Profil Saya",
  "/pengaturan": "Pengaturan",
  "/health": "Status Server",
};

export function Topbar() {
  const location = useLocation();
  const path = location.pathname;
  const schoolName = useSettingsStore((s) => s.getString("school_name", "Sekolahku"));
  const pageTitle =
    pageTitles[path] ??
    (path.startsWith("/siswa/")
      ? "Detail Siswa"
      : path.startsWith("/guru/")
        ? "Detail Guru"
        : path.startsWith("/mapel/")
          ? "Detail Mata Pelajaran"
          : path.startsWith("/pengguna/")
            ? "Detail Pengguna"
            : path.startsWith("/kelas/")
              ? "Detail Kelas"
              : path.startsWith("/jadwal/")
                ? "Jadwal Pembelajaran"
                : "Halaman");

  // Update document title
  useEffect(() => {
    document.title = `${pageTitle} — ${schoolName}`;
  }, [pageTitle, schoolName]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-1">
        <NotificationPopover />
        <UserMenu />
      </div>
    </header>
  );
}
