import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import axios from "axios";
import { settingsService } from "@/services/settingsService";
import { academicYearService } from "@/services/academicYearService";
import { useSettingsStore } from "@/stores/settingsStore";
import type {
  Setting,
  AcademicYear,
  PaginationMeta,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PaginationControls } from "@/components/features/PaginationControls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Save,
  School,
  Settings2,
  CalendarDays,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Hash,
  Award,
  ImageIcon,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Power,
  MoreHorizontal,
  Search,
  GraduationCap,
  Clock,
  Languages,
  CalendarClock,
} from "lucide-react";

// Map setting keys to icons
const settingIcons: Record<string, React.ReactNode> = {
  school_name: <School className="size-4 text-primary" />,
  school_npsn: <Hash className="size-4 text-muted-foreground" />,
  school_level: <GraduationCap className="size-4 text-muted-foreground" />,
  school_accreditation: <Award className="size-4 text-amber-500" />,
  school_address: <MapPin className="size-4 text-muted-foreground" />,
  school_city: <Building2 className="size-4 text-muted-foreground" />,
  school_province: <MapPin className="size-4 text-muted-foreground" />,
  school_postal_code: <Mail className="size-4 text-muted-foreground" />,
  school_phone: <Phone className="size-4 text-muted-foreground" />,
  school_email: <Mail className="size-4 text-primary" />,
  school_website: <Globe className="size-4 text-blue-500" />,
  school_logo_url: <ImageIcon className="size-4 text-muted-foreground" />,
  school_founded_year: <Calendar className="size-4 text-muted-foreground" />,
  timezone: <Clock className="size-4 text-muted-foreground" />,
  locale: <Languages className="size-4 text-muted-foreground" />,
  date_format: <CalendarClock className="size-4 text-muted-foreground" />,
  academic_year_start_month: <CalendarDays className="size-4 text-muted-foreground" />,
};

export default function SettingsPage() {
  const updateGlobalSettings = useSettingsStore((s) => s.updateLocal);

  // Settings state
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Academic years state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [ayMeta, setAyMeta] = useState<PaginationMeta | null>(null);
  const [isLoadingAY, setIsLoadingAY] = useState(true);
  const [ayPage, setAyPage] = useState(1);
  const [ayPageSize, setAyPageSize] = useState(10);
  const [aySearch, setAySearch] = useState("");

  // Create AY dialog
  const [createAYOpen, setCreateAYOpen] = useState(false);
  const [createAYCode, setCreateAYCode] = useState("");
  const [createAYName, setCreateAYName] = useState("");
  const [createAYStart, setCreateAYStart] = useState("");
  const [createAYEnd, setCreateAYEnd] = useState("");
  const [createAYSemester, setCreateAYSemester] = useState<"1" | "2">("1");
  const [isCreatingAY, setIsCreatingAY] = useState(false);

  // Edit AY dialog
  const [editAYOpen, setEditAYOpen] = useState(false);
  const [editAY, setEditAY] = useState<AcademicYear | null>(null);
  const [editAYCode, setEditAYCode] = useState("");
  const [editAYName, setEditAYName] = useState("");
  const [editAYStart, setEditAYStart] = useState("");
  const [editAYEnd, setEditAYEnd] = useState("");
  const [editAYSemester, setEditAYSemester] = useState<"1" | "2">("1");
  const [isSavingAY, setIsSavingAY] = useState(false);

  // Activate AY confirm
  const [activateAY, setActivateAY] = useState<AcademicYear | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Delete AY confirm
  const [deleteAY, setDeleteAY] = useState<AcademicYear | null>(null);
  const [isDeletingAY, setIsDeletingAY] = useState(false);

  // Load settings
  useEffect(() => {
    async function load() {
      setIsLoadingSettings(true);
      try {
        const res = await settingsService.getSettings();
        setSettings(res.data);
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat pengaturan";
        toast.error(message);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    load();
  }, []);

  // Load academic years
  const loadAcademicYears = useCallback(async () => {
    setIsLoadingAY(true);
    try {
      const res = await academicYearService.list({
        page: ayPage,
        limit: ayPageSize,
        search: aySearch || undefined,
      });
      setAcademicYears(res.data);
      setAyMeta(res.meta);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data tahun ajaran";
      toast.error(message);
    } finally {
      setIsLoadingAY(false);
    }
  }, [ayPage, ayPageSize, aySearch]);

  useEffect(() => {
    loadAcademicYears();
  }, [loadAcademicYears]);

  // Settings helpers
  const schoolSettings = settings.filter((s) => s.group === "school_profile");
  const appSettings = settings.filter((s) => s.group === "app_config");

  function handleSettingChange(key: string, value: string) {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  }

  function getSettingValue(setting: Setting): string {
    if (editedValues[setting.key] !== undefined) return editedValues[setting.key];
    return setting.value?.toString() ?? "";
  }

  const hasChanges = Object.keys(editedValues).length > 0;

  async function handleSaveSettings() {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const payload = Object.entries(editedValues).map(([key, value]) => ({
        key,
        value: value || null,
      }));
      const res = await settingsService.updateSettings({ settings: payload });
      setSettings((prev) =>
        prev.map((s) => {
          const updated = res.data.find((u) => u.key === s.key);
          return updated ?? s;
        })
      );
      setEditedValues({});
      // Sync public settings to global store (sidebar, title, etc.)
      updateGlobalSettings(res.data);
      toast.success("Pengaturan berhasil disimpan");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menyimpan pengaturan";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  // Academic year handlers
  async function handleCreateAY(e: React.FormEvent) {
    e.preventDefault();
    setIsCreatingAY(true);
    try {
      await academicYearService.create({
        code: createAYCode,
        name: createAYName,
        start_date: createAYStart,
        end_date: createAYEnd,
        semester: Number(createAYSemester) as 1 | 2,
      });
      toast.success("Tahun ajaran berhasil ditambahkan");
      setCreateAYOpen(false);
      setCreateAYCode("");
      setCreateAYName("");
      setCreateAYStart("");
      setCreateAYEnd("");
      setCreateAYSemester("1");
      loadAcademicYears();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambahkan tahun ajaran";
      toast.error(message);
    } finally {
      setIsCreatingAY(false);
    }
  }

  function openEditAY(ay: AcademicYear) {
    setEditAY(ay);
    setEditAYCode(ay.code);
    setEditAYName(ay.name);
    setEditAYStart(ay.start_date);
    setEditAYEnd(ay.end_date);
    setEditAYSemester(String(ay.semester) as "1" | "2");
    setEditAYOpen(true);
  }

  async function handleSaveAY() {
    if (!editAY) return;
    const updates: Record<string, string | number> = {};
    if (editAYCode !== editAY.code) updates.code = editAYCode;
    if (editAYName !== editAY.name) updates.name = editAYName;
    if (editAYStart !== editAY.start_date) updates.start_date = editAYStart;
    if (editAYEnd !== editAY.end_date) updates.end_date = editAYEnd;
    if (Number(editAYSemester) !== editAY.semester) {
      updates.semester = Number(editAYSemester);
    }
    if (Object.keys(updates).length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }
    setIsSavingAY(true);
    try {
      await academicYearService.update(editAY.id, updates);
      toast.success("Tahun ajaran berhasil diperbarui");
      setEditAYOpen(false);
      loadAcademicYears();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui tahun ajaran";
      toast.error(message);
    } finally {
      setIsSavingAY(false);
    }
  }

  async function handleActivateAY() {
    if (!activateAY) return;
    setIsActivating(true);
    try {
      await academicYearService.activate(activateAY.id);
      toast.success(`Tahun ajaran "${activateAY.name}" berhasil diaktifkan`);
      setActivateAY(null);
      loadAcademicYears();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengaktifkan tahun ajaran";
      toast.error(message);
    } finally {
      setIsActivating(false);
    }
  }

  async function handleDeleteAY() {
    if (!deleteAY) return;
    setIsDeletingAY(true);
    try {
      await academicYearService.delete(deleteAY.id);
      toast.success("Tahun ajaran berhasil dihapus");
      setDeleteAY(null);
      loadAcademicYears();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menghapus tahun ajaran";
      toast.error(message);
    } finally {
      setIsDeletingAY(false);
    }
  }

  function renderSettingFields(group: Setting[]) {
    if (isLoadingSettings) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (group.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Tidak ada pengaturan ditemukan
        </p>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {group.map((setting) => (
          <div
            key={setting.key}
            className={`space-y-2 ${
              ["school_name", "school_address"].includes(setting.key)
                ? "sm:col-span-2"
                : ""
            }`}
          >
            <Label
              htmlFor={setting.key}
              className="flex items-center gap-2 text-sm font-medium"
            >
              {settingIcons[setting.key] ?? (
                <Settings2 className="size-3.5 text-muted-foreground" />
              )}
              {setting.label}
              {setting.is_public && (
                <Badge variant="outline" className="text-[10px]">
                  Public
                </Badge>
              )}
            </Label>
            <Input
              id={setting.key}
              value={getSettingValue(setting)}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              placeholder={setting.description ?? ""}
              type={setting.type === "integer" ? "number" : "text"}
            />
            {setting.description && (
              <p className="text-xs text-muted-foreground">
                {setting.description}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  function handleAcademicYearPageSizeChange(nextPageSize: number) {
    setAyPage(1);
    setAyPageSize(nextPageSize);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola profil sekolah, konfigurasi aplikasi, dan tahun ajaran
        </p>
      </div>

      <Tabs defaultValue="school">
        <TabsList>
          <TabsTrigger value="school" className="gap-2">
            <School className="size-4" />
            Profil Sekolah
          </TabsTrigger>
          <TabsTrigger value="app" className="gap-2">
            <Settings2 className="size-4" />
            Konfigurasi
          </TabsTrigger>
          <TabsTrigger value="academic-years" className="gap-2">
            <CalendarDays className="size-4" />
            Tahun Ajaran
          </TabsTrigger>
        </TabsList>

        {/* School Profile Tab */}
        <TabsContent value="school">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Profil Sekolah</CardTitle>
                <CardDescription>
                  Informasi dasar dan identitas sekolah
                </CardDescription>
              </div>
              {hasChanges && (
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  Simpan Perubahan
                </Button>
              )}
            </CardHeader>
            <CardContent>{renderSettingFields(schoolSettings)}</CardContent>
          </Card>
        </TabsContent>

        {/* App Config Tab */}
        <TabsContent value="app">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Konfigurasi Aplikasi</CardTitle>
                <CardDescription>
                  Pengaturan zona waktu, bahasa, dan format tampilan
                </CardDescription>
              </div>
              {hasChanges && (
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  Simpan Perubahan
                </Button>
              )}
            </CardHeader>
            <CardContent>{renderSettingFields(appSettings)}</CardContent>
          </Card>
        </TabsContent>

        {/* Academic Years Tab */}
        <TabsContent value="academic-years" className="space-y-4">
          {/* Search & Add */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari kode atau nama tahun ajaran..."
                    value={aySearch}
                    onChange={(e) => {
                      setAySearch(e.target.value);
                      setAyPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setCreateAYOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Tambah Tahun Ajaran
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Tahun Ajaran</CardTitle>
              <CardDescription>
                {ayMeta
                  ? `Menampilkan ${academicYears.length} dari ${ayMeta.total} tahun ajaran`
                  : "Memuat..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAY ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : academicYears.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CalendarDays className="mb-2 size-8 opacity-50" />
                  <p className="text-sm">Tidak ada tahun ajaran ditemukan</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Tanggal Mulai</TableHead>
                        <TableHead>Tanggal Selesai</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {academicYears.map((ay) => (
                        <TableRow key={ay.id}>
                          <TableCell className="font-mono text-sm">{ay.code}</TableCell>
                          <TableCell className="font-medium">{ay.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {ay.semester === 1 ? "Semester Ganjil" : "Semester Genap"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{ay.start_date}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{ay.end_date}</TableCell>
                          <TableCell>
                            <Badge variant={ay.is_active ? "default" : "secondary"}>
                              {ay.is_active ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-xs">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditAY(ay)}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>
                                {!ay.is_active && (
                                  <DropdownMenuItem onClick={() => setActivateAY(ay)}>
                                    <Power className="mr-2 size-4" />
                                    Aktifkan
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteAY(ay)}
                                  className="text-destructive focus:text-destructive"
                                  disabled={ay.is_active}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {ayMeta && (
                    <PaginationControls
                      currentPage={ayMeta.page}
                      totalPages={ayMeta.totalPages}
                      totalItems={ayMeta.total}
                      pageSize={ayPageSize}
                      itemLabel="tahun ajaran"
                      onPageChange={setAyPage}
                      onPageSizeChange={handleAcademicYearPageSizeChange}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Academic Year Dialog */}
      <Dialog open={createAYOpen} onOpenChange={setCreateAYOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Plus className="size-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Tambah Tahun Ajaran</DialogTitle>
                <DialogDescription>
                  Buat tahun ajaran baru (nonaktif secara default)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <form onSubmit={handleCreateAY} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="ayCode"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Hash className="size-3.5 text-muted-foreground" />
                  Kode <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ayCode"
                  value={createAYCode}
                  onChange={(e) => setCreateAYCode(e.target.value)}
                  required
                  maxLength={20}
                  placeholder="2025/2026"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ayName"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  Nama <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ayName"
                  value={createAYName}
                  onChange={(e) => setCreateAYName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Tahun Ajaran 2025/2026"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ayStart"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Calendar className="size-3.5 text-muted-foreground" />
                  Tanggal Mulai <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ayStart"
                  type="date"
                  value={createAYStart}
                  onChange={(e) => setCreateAYStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ayEnd"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Calendar className="size-3.5 text-muted-foreground" />
                  Tanggal Selesai <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ayEnd"
                  type="date"
                  value={createAYEnd}
                  onChange={(e) => setCreateAYEnd(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  Semester <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={createAYSemester}
                  onValueChange={(value) =>
                    setCreateAYSemester(value as "1" | "2")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester Ganjil</SelectItem>
                    <SelectItem value="2">Semester Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateAYOpen(false)}
                disabled={isCreatingAY}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isCreatingAY}>
                {isCreatingAY && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Tambah Tahun Ajaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Academic Year Dialog */}
      <Dialog open={editAYOpen} onOpenChange={setEditAYOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Pencil className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Edit Tahun Ajaran</DialogTitle>
                <DialogDescription>
                  Perbarui informasi tahun ajaran {editAY?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="editAYCode"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Hash className="size-3.5 text-muted-foreground" />
                Kode
              </Label>
              <Input
                id="editAYCode"
                value={editAYCode}
                onChange={(e) => setEditAYCode(e.target.value)}
                maxLength={20}
                placeholder="2025/2026"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="editAYName"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <CalendarDays className="size-3.5 text-muted-foreground" />
                Nama
              </Label>
              <Input
                id="editAYName"
                value={editAYName}
                onChange={(e) => setEditAYName(e.target.value)}
                minLength={2}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="editAYStart"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Calendar className="size-3.5 text-muted-foreground" />
                Tanggal Mulai
              </Label>
              <Input
                id="editAYStart"
                type="date"
                value={editAYStart}
                onChange={(e) => setEditAYStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="editAYEnd"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Calendar className="size-3.5 text-muted-foreground" />
                Tanggal Selesai
              </Label>
              <Input
                id="editAYEnd"
                type="date"
                value={editAYEnd}
                onChange={(e) => setEditAYEnd(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="size-3.5 text-muted-foreground" />
                Semester
              </Label>
              <Select
                value={editAYSemester}
                onValueChange={(value) => setEditAYSemester(value as "1" | "2")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester Ganjil</SelectItem>
                  <SelectItem value="2">Semester Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditAYOpen(false)}
              disabled={isSavingAY}
            >
              Batal
            </Button>
            <Button onClick={handleSaveAY} disabled={isSavingAY}>
              {isSavingAY && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Academic Year Confirm */}
      <AlertDialog
        open={!!activateAY}
        onOpenChange={(open) => !open && setActivateAY(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Power className="size-5 text-emerald-500" />
              </div>
              <div>
                <AlertDialogTitle>Aktifkan Tahun Ajaran?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tahun ajaran lain akan otomatis dinonaktifkan.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          {activateAY && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <Avatar>
                <AvatarFallback className="text-xs">
                  <CalendarDays className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {activateAY.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {activateAY.start_date} — {activateAY.end_date}
                </p>
              </div>
              <Badge variant="secondary">Nonaktif</Badge>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActivating}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivateAY}
              disabled={isActivating}
            >
              {isActivating && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Aktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Academic Year Confirm */}
      <AlertDialog
        open={!!deleteAY}
        onOpenChange={(open) => !open && setDeleteAY(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle>Hapus Tahun Ajaran?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          {deleteAY && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                <Avatar>
                  <AvatarFallback className="text-xs">
                    <CalendarDays className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {deleteAY.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {deleteAY.code} • {deleteAY.start_date} —{" "}
                    {deleteAY.end_date}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs text-destructive">
                  Tahun ajaran akan dihapus permanen. Pastikan tidak ada data
                  wali kelas yang terkait.
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAY}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAY}
              disabled={isDeletingAY}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAY && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
