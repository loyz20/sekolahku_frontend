import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarDays, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { academicYearService } from "@/services/academicYearService";
import type { AcademicYear } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const schoolName = useSettingsStore((s) => s.getString("school_name", "Sekolahku"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [isLoadingAcademicYears, setIsLoadingAcademicYears] = useState(true);
  const [academicYearError, setAcademicYearError] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsRevealed(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.title = `Masuk — ${schoolName}`;
  }, [schoolName]);

  useEffect(() => {
    let isMounted = true;

    const loadAcademicYears = async () => {
      setIsLoadingAcademicYears(true);
      setAcademicYearError("");

      try {
        const res = await academicYearService.listPublic({ limit: 100 });
        if (!isMounted) return;

        const years = res.data ?? [];
        setAcademicYears(years);

        const active = years.find((year) => year.is_active);
        const fallback = years[0];
        const selected = active || fallback;

        setSelectedAcademicYearId(selected ? String(selected.id) : "");
      } catch {
        if (!isMounted) return;
        setAcademicYearError("Gagal memuat daftar tahun akademik");
      } finally {
        if (isMounted) {
          setIsLoadingAcademicYears(false);
        }
      }
    };

    loadAcademicYears();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();

    if (!selectedAcademicYearId) {
      setAcademicYearError("Tahun akademik wajib dipilih");
      return;
    }

    const selectedAcademicYear = academicYears.find(
      (year) => String(year.id) === selectedAcademicYearId
    );

    localStorage.setItem("selectedAcademicYearId", selectedAcademicYearId);
    localStorage.setItem(
      "selectedAcademicYearCode",
      selectedAcademicYear?.code ?? ""
    );
    localStorage.setItem(
      "selectedAcademicYearName",
      selectedAcademicYear?.name ?? ""
    );

    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch {
      // error is handled by store
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.28),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.22),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(249,115,22,0.16),transparent_40%)]" />
      <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -right-20 bottom-12 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 lg:grid-cols-2 lg:px-8">
        <section
          className={`order-2 rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl transition-all duration-700 lg:order-1 lg:p-10 ${
            isRevealed ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <div
            className={`mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-100/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition-all duration-700 delay-100 ${
              isRevealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Platform Akademik Terpadu
          </div>

          <h1
            className={`text-balance text-3xl font-semibold leading-tight text-white transition-all duration-700 delay-150 sm:text-4xl lg:text-5xl ${
              isRevealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            {schoolName}
          </h1>

          <p
            className={`mt-4 max-w-xl text-sm leading-relaxed text-slate-200 transition-all duration-700 delay-200 sm:text-base ${
              isRevealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            Satu gerbang untuk pengelolaan pembelajaran, jadwal, dan penilaian.
            Pilih tahun akademik saat masuk untuk memastikan seluruh data CRUD terkunci pada periode yang tepat.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div
              className={`rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-700 delay-250 ${
                isRevealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-200/20 text-cyan-100">
                <CalendarDays className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm font-medium text-white">Konteks Tahun Akademik</p>
              <p className="mt-1 text-xs text-slate-300">Sinkron ke semua modul penjadwalan dan penilaian.</p>
            </div>
            <div
              className={`rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-700 delay-300 ${
                isRevealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-200/20 text-emerald-100">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm font-medium text-white">Akses Terproteksi</p>
              <p className="mt-1 text-xs text-slate-300">Role-based access untuk admin, guru, dan superadmin.</p>
            </div>
          </div>
        </section>

        <section
          className={`order-1 transition-all duration-700 delay-150 lg:order-2 ${
            isRevealed ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <Card className="mx-auto w-full max-w-md border-white/25 bg-white/95 shadow-2xl shadow-black/30 backdrop-blur-md">
            <CardHeader>
              <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <CardTitle className="text-2xl text-slate-900">Masuk</CardTitle>
              <CardDescription className="text-slate-600">
                Gunakan akun Anda untuk melanjutkan ke dashboard.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email atau NIP</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Masuk dengan email (guru@example.com) atau NIP"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <p className="text-xs text-slate-500">
                    Gunakan email lengkap dengan @ atau nomor NIP Anda
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic-year">Tahun Akademik</Label>
                  <Select
                    value={selectedAcademicYearId}
                    onValueChange={(value) => {
                      setSelectedAcademicYearId(value);
                      setAcademicYearError("");
                    }}
                    disabled={isLoadingAcademicYears || academicYears.length === 0}
                  >
                    <SelectTrigger id="academic-year" className="w-full">
                      <SelectValue
                        placeholder={
                          isLoadingAcademicYears
                            ? "Memuat tahun akademik..."
                            : "Pilih tahun akademik"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={String(year.id)}>
                          {year.name}{year.is_active ? " (Aktif)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {academicYearError && (
                    <p className="text-sm text-destructive">{academicYearError}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-slate-900 text-white hover:bg-slate-800"
                  disabled={isLoading || isLoadingAcademicYears || !selectedAcademicYearId}
                >
                  {isLoading ? "Memproses..." : "Masuk"}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                <p className="text-sm text-muted-foreground">
                  Belum punya akun?{" "}
                  <Link to="/register" className="font-medium text-slate-900 hover:underline">
                    Daftar
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
}
