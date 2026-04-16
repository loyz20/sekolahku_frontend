import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CalendarDays, Sparkles } from "lucide-react";
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
  const selectedAcademicYearName =
    localStorage.getItem("selectedAcademicYearName") ||
    "Belum dipilih";
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
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/65 px-4 backdrop-blur-md md:px-6">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          <SidebarTrigger className="-ml-1 rounded-lg hover:bg-slate-100" />
          <Separator orientation="vertical" className="mr-2 h-5" />

          <div className="flex min-w-0 flex-col">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate text-base font-semibold text-slate-900">
                    {pageTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Sparkles className="h-3 w-3" />
              <span className="truncate">{schoolName}</span>
            </div>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-50/90 px-3 py-1.5 text-xs font-medium text-sky-900">
            <CalendarDays className="h-3.5 w-3.5 text-sky-700" />
            <span className="text-sky-700">Tahun Ajaran:</span>
            <span className="max-w-[18rem] truncate">{selectedAcademicYearName}</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5">
          <NotificationPopover />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
