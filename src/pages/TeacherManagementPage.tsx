import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { teacherService } from "@/services/teacherService";
import type {
  PaginationMeta,
  TeacherDetail,
  TeacherListItem,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { PaginationControls } from "@/components/features/PaginationControls";
import {
  Briefcase,
  Loader2,
  Plus,
  Search,
  UploadCloud,
  Download,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  Trash2,
  Hash,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Check,
  User,
} from "lucide-react";

export default function TeacherManagementPage() {
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [createNip, setCreateNip] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPlaceOfBirth, setCreatePlaceOfBirth] = useState("");
  const [createDateOfBirth, setCreateDateOfBirth] = useState("");
  const [createGender, setCreateGender] = useState("-");
  const [createAddress, setCreateAddress] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createSpecialization, setCreateSpecialization] = useState("");
  const [createQualification, setCreateQualification] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherDetail | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editNip, setEditNip] = useState("");
  const [editName, setEditName] = useState("");
  const [editPlaceOfBirth, setEditPlaceOfBirth] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editGender, setEditGender] = useState("-");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("");
  const [editQualification, setEditQualification] = useState("");

  const [toggleTeacher, setToggleTeacher] = useState<TeacherListItem | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const [deleteTeacher, setDeleteTeacher] = useState<TeacherListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await teacherService.list({
        page,
        limit: pageSize,
        search: search || undefined,
        specialization: filterSpecialization || undefined,
      });
      setTeachers(res.data);
      setMeta(res.meta);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data guru";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, filterSpecialization]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  function handleSearch() {
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setFilterSpecialization("");
    setPage(1);
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPage(1);
    setPageSize(nextPageSize);
  }

  function resetCreateForm() {
    setCreateNip("");
    setCreateName("");
    setCreatePlaceOfBirth("");
    setCreateDateOfBirth("");
    setCreateGender("-");
    setCreateAddress("");
    setCreatePhone("");
    setCreateEmail("");
    setCreateSpecialization("");
    setCreateQualification("");
  }

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      await teacherService.create({
        nip: createNip,
        name: createName,
        place_of_birth: createPlaceOfBirth || undefined,
        date_of_birth: createDateOfBirth || undefined,
        gender: createGender === "-" ? undefined : (createGender as "M" | "F"),
        address: createAddress || undefined,
        phone: createPhone || undefined,
        email: createEmail || undefined,
        specialization: createSpecialization || undefined,
        qualification: createQualification || undefined,
      });
      toast.success("Guru berhasil ditambahkan");
      setCreateOpen(false);
      resetCreateForm();
      loadTeachers();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambahkan guru";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function openEditTeacher(teacherId: number) {
    setIsLoadingEdit(true);
    setEditOpen(true);
    try {
      const res = await teacherService.getById(teacherId);
      const teacher = res.data;
      setEditTeacher(teacher);
      setEditNip(teacher.nip);
      setEditName(teacher.name);
      setEditPlaceOfBirth(teacher.place_of_birth ?? "");
      setEditDateOfBirth(teacher.date_of_birth ?? "");
      setEditGender(teacher.gender ?? "-");
      setEditAddress(teacher.address ?? "");
      setEditPhone(teacher.phone ?? "");
      setEditEmail(teacher.email ?? "");
      setEditSpecialization(teacher.specialization ?? "");
      setEditQualification(teacher.qualification ?? "");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat detail guru";
      toast.error(message);
      setEditOpen(false);
    } finally {
      setIsLoadingEdit(false);
    }
  }

  async function handleSaveEdit() {
    if (!editTeacher) return;

    const payload: Record<string, string | null> = {};
    if (editNip !== editTeacher.nip) payload.nip = editNip;
    if (editName !== editTeacher.name) payload.name = editName;
    if (editPlaceOfBirth !== (editTeacher.place_of_birth ?? "")) {
      payload.place_of_birth = editPlaceOfBirth || null;
    }
    if (editDateOfBirth !== (editTeacher.date_of_birth ?? "")) {
      payload.date_of_birth = editDateOfBirth || null;
    }
    if (editGender !== (editTeacher.gender ?? "-")) {
      payload.gender = editGender === "-" ? null : editGender;
    }
    if (editAddress !== (editTeacher.address ?? "")) {
      payload.address = editAddress || null;
    }
    if (editPhone !== (editTeacher.phone ?? "")) {
      payload.phone = editPhone || null;
    }
    if (editEmail !== (editTeacher.email ?? "")) {
      payload.email = editEmail || null;
    }
    if (editSpecialization !== (editTeacher.specialization ?? "")) {
      payload.specialization = editSpecialization || null;
    }
    if (editQualification !== (editTeacher.qualification ?? "")) {
      payload.qualification = editQualification || null;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }

    setIsSavingEdit(true);
    try {
      await teacherService.update(editTeacher.id, payload);
      toast.success("Data guru berhasil diperbarui");
      setEditOpen(false);
      setEditTeacher(null);
      loadTeachers();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui guru";
      toast.error(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleToggleStatus() {
    if (!toggleTeacher) return;
    setIsToggling(true);
    try {
      await teacherService.toggleStatus(toggleTeacher.id);
      toast.success(
        toggleTeacher.is_active ? "Guru dinonaktifkan" : "Guru diaktifkan"
      );
      setToggleTeacher(null);
      loadTeachers();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengubah status guru";
      toast.error(message);
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDeleteTeacher() {
    if (!deleteTeacher) return;
    setIsDeleting(true);
    try {
      await teacherService.delete(deleteTeacher.id);
      toast.success("Guru berhasil dihapus");
      setDeleteTeacher(null);
      loadTeachers();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menghapus guru";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImportFile(e.target.files?.[0] ?? null);
  }

  async function handleDownloadTemplate() {
    try {
      await teacherService.downloadImportTemplate();
      toast.success("Template berhasil diunduh");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengunduh template";
      toast.error(message);
    }
  }

  async function handleImportTeachers(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setIsImporting(true);
    try {
      const res = await teacherService.import(importFile);
      toast.success(`Import selesai. Berhasil: ${res.data.created}`);
      if (res.data.errors.length) {
        toast.error(`${res.data.errors.length} baris gagal diimpor`);
      }
      setImportOpen(false);
      setImportFile(null);
      loadTeachers();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengimpor guru";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Guru</h1>
          <p className="text-muted-foreground">
            Kelola data guru, status aktif, dan profil singkat
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <UploadCloud className="mr-2 size-4" />
            Import
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Tambah Guru
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari NIP, nama, atau email..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} className="w-full sm:w-auto">
                <Search className="mr-2 size-4" />
                Cari
              </Button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Label htmlFor="filterSpec" className="mb-2 block text-xs font-medium text-muted-foreground">
                  Filter Mata Pelajaran
                </Label>
                <Input
                  id="filterSpec"
                  placeholder="Misal: Matematika, IPA, Bahasa Indonesia..."
                  value={filterSpecialization}
                  onChange={(e) => setFilterSpecialization(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              {(search || filterSpecialization) && (
                <Button variant="outline" onClick={clearFilters} className="mt-auto">
                  Bersihkan Filter
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Guru</CardTitle>
          <CardDescription>
            {meta
              ? `Menampilkan ${teachers.length} dari ${meta.total} guru`
              : "Memuat..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Briefcase className="mb-2 size-8 opacity-50" />
              <p className="text-sm">Belum ada data guru</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="hidden md:table-cell">Keahlian</TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Dibuat</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                        {teacher.nip}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/guru/${teacher.id}`}
                          className="font-medium hover:underline"
                        >
                          {teacher.name}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {teacher.specialization ?? "-"}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {teacher.email ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={teacher.is_active ? "default" : "secondary"}>
                          {teacher.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {teacher.created_at}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link to={`/guru/${teacher.id}`}>
                                <Eye className="mr-2 size-4" />
                                Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditTeacher(teacher.id)}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setToggleTeacher(teacher)}>
                              <Power className="mr-2 size-4" />
                              {teacher.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTeacher(teacher)}
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

              {meta && (
                <PaginationControls
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  totalItems={meta.total}
                  pageSize={pageSize}
                  itemLabel="guru"
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={importOpen}
        onOpenChange={(open) => {
          setImportOpen(open);
          if (!open) {
            setImportFile(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <UploadCloud className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Import Guru dari Excel</DialogTitle>
                <DialogDescription>
                  Unggah file .xls atau .xlsx. Kolom minimal: NIP, Nama.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-2" />
          <form onSubmit={handleImportTeachers} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">File Excel</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-auto px-2 py-1 text-xs"
                >
                  <Download className="mr-1 size-3" />
                  Download Template
                </Button>
              </div>
              <input
                accept=".xls,.xlsx"
                type="file"
                onChange={handleImportFileChange}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Header yang didukung: NIP, Nama, Tempat Lahir, Tanggal Lahir, Gender, Alamat, No HP, Email, Spesialisasi, Kualifikasi.
              </p>
            </div>
            <Separator className="my-2" />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isImporting} className="gap-2">
                {isImporting && <Loader2 className="size-4 animate-spin" />}
                Import
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Teacher Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Plus className="size-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Tambah Guru Baru</DialogTitle>
                <DialogDescription>
                  Isi data lengkap guru untuk didaftarkan ke sistem
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-2" />
          <form onSubmit={handleCreateTeacher} className="space-y-6">
            {/* Identitas Guru */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Briefcase className="size-4 text-primary" />
                Identitas Guru
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="createNip" className="flex items-center gap-2 text-sm font-medium">
                    <Hash className="size-3.5 text-muted-foreground" />
                    NIP <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="createNip"
                    value={createNip}
                    onChange={(e) => setCreateNip(e.target.value)}
                    required
                    placeholder="Nomor induk pegawai"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createName" className="flex items-center gap-2 text-sm font-medium">
                    <User className="size-3.5 text-muted-foreground" />
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="createName"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    placeholder="Nama guru"
                  />
                </div>
              </div>
            </div>

            {/* Biodata Guru */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="size-4 text-primary" />
                Biodata Guru
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="createPlaceOfBirth" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    Tempat Lahir
                  </Label>
                  <Input
                    id="createPlaceOfBirth"
                    value={createPlaceOfBirth}
                    onChange={(e) => setCreatePlaceOfBirth(e.target.value)}
                    placeholder="Kota/kabupaten"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createDateOfBirth" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    Tanggal Lahir
                  </Label>
                  <Input
                    id="createDateOfBirth"
                    type="date"
                    value={createDateOfBirth}
                    onChange={(e) => setCreateDateOfBirth(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <User className="size-3.5 text-muted-foreground" />
                    Gender
                  </Label>
                  <Select value={createGender} onValueChange={setCreateGender}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">Tidak ditentukan</SelectItem>
                      <SelectItem value="M">Laki-laki</SelectItem>
                      <SelectItem value="F">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createAddress" className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    Alamat Rumah
                  </Label>
                  <Input
                    id="createAddress"
                    value={createAddress}
                    onChange={(e) => setCreateAddress(e.target.value)}
                    placeholder="Alamat tinggal"
                  />
                </div>
              </div>
            </div>

            {/* Kontak & Profesional */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="size-4 text-primary" />
                Informasi Kontak & Profesional
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="createEmail" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="size-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="createEmail"
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createPhone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="size-3.5 text-muted-foreground" />
                    No. HP
                  </Label>
                  <Input
                    id="createPhone"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="0812345678"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="createSpecialization" className="flex items-center gap-2 text-sm font-medium">
                    <Briefcase className="size-3.5 text-muted-foreground" />
                    Mata Pelajaran/Keahlian
                  </Label>
                  <Input
                    id="createSpecialization"
                    value={createSpecialization}
                    onChange={(e) => setCreateSpecialization(e.target.value)}
                    placeholder="Matematika, IPA, dll"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createQualification" className="flex items-center gap-2 text-sm font-medium">
                    <Briefcase className="size-3.5 text-muted-foreground" />
                    Kualifikasi Pendidikan
                  </Label>
                  <Input
                    id="createQualification"
                    value={createQualification}
                    onChange={(e) => setCreateQualification(e.target.value)}
                    placeholder="S1 Pendidikan Matematika"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-2" />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-2">
                {isCreating && <Loader2 className="size-4 animate-spin" />}
                <Plus className="size-4" />
                Tambah Guru
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTeacher(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Pencil className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Edit Data Guru</DialogTitle>
                <DialogDescription>
                  Perbarui profil guru: {editTeacher?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {isLoadingEdit ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Separator className="my-2" />
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Briefcase className="size-4 text-primary" />
                    Identitas Guru
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="editNip" className="flex items-center gap-2 text-sm font-medium">
                        <Hash className="size-3.5 text-muted-foreground" />
                        NIP
                      </Label>
                      <Input
                        id="editNip"
                        value={editNip}
                        onChange={(e) => setEditNip(e.target.value)}
                        placeholder="NIP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editName" className="flex items-center gap-2 text-sm font-medium">
                        <User className="size-3.5 text-muted-foreground" />
                        Nama Lengkap
                      </Label>
                      <Input
                        id="editName"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nama guru"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Calendar className="size-4 text-primary" />
                    Biodata Guru
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="editPlaceOfBirth" className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        Tempat Lahir
                      </Label>
                      <Input
                        id="editPlaceOfBirth"
                        value={editPlaceOfBirth}
                        onChange={(e) => setEditPlaceOfBirth(e.target.value)}
                        placeholder="Kota/kabupaten"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editDateOfBirth" className="flex items-center gap-2 text-sm font-medium">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        Tanggal Lahir
                      </Label>
                      <Input
                        id="editDateOfBirth"
                        type="date"
                        value={editDateOfBirth}
                        onChange={(e) => setEditDateOfBirth(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <User className="size-3.5 text-muted-foreground" />
                        Gender
                      </Label>
                      <Select value={editGender} onValueChange={setEditGender}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">Tidak ditentukan</SelectItem>
                          <SelectItem value="M">Laki-laki</SelectItem>
                          <SelectItem value="F">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editAddress" className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        Alamat Rumah
                      </Label>
                      <Input
                        id="editAddress"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Alamat tinggal"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Mail className="size-4 text-primary" />
                    Informasi Kontak & Profesional
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="editEmail" className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="size-3.5 text-muted-foreground" />
                        Email
                      </Label>
                      <Input
                        id="editEmail"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editPhone" className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="size-3.5 text-muted-foreground" />
                        No. HP
                      </Label>
                      <Input
                        id="editPhone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="0812345678"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="editSpecialization" className="flex items-center gap-2 text-sm font-medium">
                        <Briefcase className="size-3.5 text-muted-foreground" />
                        Mata Pelajaran/Keahlian
                      </Label>
                      <Input
                        id="editSpecialization"
                        value={editSpecialization}
                        onChange={(e) => setEditSpecialization(e.target.value)}
                        placeholder="Matematika, IPA, dll"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editQualification" className="flex items-center gap-2 text-sm font-medium">
                        <Briefcase className="size-3.5 text-muted-foreground" />
                        Kualifikasi Pendidikan
                      </Label>
                      <Input
                        id="editQualification"
                        value={editQualification}
                        onChange={(e) => setEditQualification(e.target.value)}
                        placeholder="S1 Pendidikan Matematika"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-2" />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Batal
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="gap-2">
                  {isSavingEdit && <Loader2 className="size-4 animate-spin" />}
                  <Check className="size-4" />
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle Status Alert */}
      <AlertDialog open={!!toggleTeacher} onOpenChange={() => setToggleTeacher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTeacher?.is_active ? "Nonaktifkan guru" : "Aktifkan guru"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Status akun guru {toggleTeacher?.name} akan diubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus} disabled={isToggling}>
              {isToggling && <Loader2 className="mr-2 size-4 animate-spin" />}
              Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteTeacher} onOpenChange={() => setDeleteTeacher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus guru</AlertDialogTitle>
            <AlertDialogDescription>
              Data guru {deleteTeacher?.name} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeacher}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
