import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { studentService } from "@/services/studentService";
import { classService } from "@/services/classService";
import { academicYearService } from "@/services/academicYearService";
import type {
  AcademicYear,
  ClassListItem,
  PaginationMeta,
  StudentDetail,
  StudentListItem,
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
  GraduationCap,
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

export default function StudentManagementPage() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [createNis, setCreateNis] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPlaceOfBirth, setCreatePlaceOfBirth] = useState("");
  const [createDateOfBirth, setCreateDateOfBirth] = useState("");
  const [createGender, setCreateGender] = useState("-");
  const [createAddress, setCreateAddress] = useState("");
  const [createParentPhone, setCreateParentPhone] = useState("");
  const [createEmail, setCreateEmail] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentDetail | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editNis, setEditNis] = useState("");
  const [editName, setEditName] = useState("");
  const [editPlaceOfBirth, setEditPlaceOfBirth] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editGender, setEditGender] = useState("-");
  const [editAddress, setEditAddress] = useState("");
  const [editParentPhone, setEditParentPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [toggleStudent, setToggleStudent] = useState<StudentListItem | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const [deleteStudent, setDeleteStudent] = useState<StudentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReferenceData = useCallback(async () => {
    try {
      const [classesRes, yearsRes] = await Promise.all([
        classService.list({ limit: 100 }),
        academicYearService.list({ limit: 100 }),
      ]);
      setClasses(classesRes.data);
      setAcademicYears(yearsRes.data);
    } catch {
      // Keep filters usable with fallback values.
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await studentService.list({
        page,
        limit: pageSize,
        search: search || undefined,
        class_id: classFilter === "all" ? undefined : Number(classFilter),
        academic_year_id:
          academicYearFilter === "all" ? undefined : Number(academicYearFilter),
      });
      setStudents(res.data);
      setMeta(res.meta);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data siswa";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, classFilter, academicYearFilter]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  function resetCreateForm() {
    setCreateNis("");
    setCreateName("");
    setCreatePlaceOfBirth("");
    setCreateDateOfBirth("");
    setCreateGender("-");
    setCreateAddress("");
    setCreateParentPhone("");
    setCreateEmail("");
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPage(1);
    setPageSize(nextPageSize);
  }

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      await studentService.create({
        nis: createNis,
        name: createName,
        place_of_birth: createPlaceOfBirth || undefined,
        date_of_birth: createDateOfBirth || undefined,
        gender: createGender === "-" ? undefined : (createGender as "M" | "F"),
        address: createAddress || undefined,
        parent_phone: createParentPhone || undefined,
        email: createEmail || undefined,
      });
      toast.success("Siswa berhasil ditambahkan");
      setCreateOpen(false);
      resetCreateForm();
      loadStudents();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambahkan siswa";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function openEditStudent(studentId: number) {
    setIsLoadingEdit(true);
    setEditOpen(true);
    try {
      const res = await studentService.getById(studentId);
      const student = res.data;
      setEditStudent(student);
      setEditNis(student.nis);
      setEditName(student.name);
      setEditPlaceOfBirth(student.place_of_birth ?? "");
      setEditDateOfBirth(student.date_of_birth ?? "");
      setEditGender(student.gender ?? "-");
      setEditAddress(student.address ?? "");
      setEditParentPhone(student.parent_phone ?? "");
      setEditEmail(student.email ?? "");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat detail siswa";
      toast.error(message);
      setEditOpen(false);
    } finally {
      setIsLoadingEdit(false);
    }
  }

  async function handleSaveEdit() {
    if (!editStudent) return;

    const payload: Record<string, string | null> = {};
    if (editNis !== editStudent.nis) payload.nis = editNis;
    if (editName !== editStudent.name) payload.name = editName;
    if (editPlaceOfBirth !== (editStudent.place_of_birth ?? "")) {
      payload.place_of_birth = editPlaceOfBirth || null;
    }
    if (editDateOfBirth !== (editStudent.date_of_birth ?? "")) {
      payload.date_of_birth = editDateOfBirth || null;
    }
    if (editGender !== (editStudent.gender ?? "-")) {
      payload.gender = editGender === "-" ? null : editGender;
    }
    if (editAddress !== (editStudent.address ?? "")) {
      payload.address = editAddress || null;
    }
    if (editParentPhone !== (editStudent.parent_phone ?? "")) {
      payload.parent_phone = editParentPhone || null;
    }
    if (editEmail !== (editStudent.email ?? "")) {
      payload.email = editEmail || null;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }

    setIsSavingEdit(true);
    try {
      await studentService.update(editStudent.id, payload);
      toast.success("Data siswa berhasil diperbarui");
      setEditOpen(false);
      setEditStudent(null);
      loadStudents();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui siswa";
      toast.error(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleToggleStatus() {
    if (!toggleStudent) return;
    setIsToggling(true);
    try {
      await studentService.toggleStatus(toggleStudent.id);
      toast.success(
        toggleStudent.is_active ? "Siswa dinonaktifkan" : "Siswa diaktifkan"
      );
      setToggleStudent(null);
      loadStudents();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengubah status siswa";
      toast.error(message);
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDeleteStudent() {
    if (!deleteStudent) return;
    setIsDeleting(true);
    try {
      await studentService.delete(deleteStudent.id);
      toast.success("Siswa berhasil dihapus");
      setDeleteStudent(null);
      loadStudents();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menghapus siswa";
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
      await studentService.downloadImportTemplate();
      toast.success("Template berhasil diunduh");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Gagal mengunduh template';
      toast.error(message);
    }
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    setIsImporting(true);
    try {
      const res = await studentService.import(importFile);
      const data = res.data;
      let msg = `Import selesai. Berhasil: ${data.created}`;
      if (data.enrolled) msg += `, Terdaftar kelas: ${data.enrolled}`;
      toast.success(msg);
      if (data.errors && data.errors.length) {
        toast.error(`${data.errors.length} baris gagal diimpor`);
      }
      setImportOpen(false);
      setImportFile(null);
      loadStudents();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Gagal mengimpor file';
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-200/35 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center rounded-full border border-cyan-200 bg-white/70 px-3 py-1 text-xs font-medium text-cyan-700">
              Modul Akademik
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Siswa</h1>
            <p className="max-w-xl text-slate-600">
              Kelola data siswa, status aktif, dan filter kelas/tahun ajaran
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="h-11 w-full justify-center bg-white/80 sm:w-auto"
            >
              <UploadCloud className="mr-2 size-4" />
              Import
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-11 w-full justify-center bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700 sm:w-auto"
            >
              <Plus className="mr-2 size-4" />
              Tambah Siswa
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari NIS, nama, atau email..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    loadStudents();
                  }
                }}
              />
            </div>
            <Select
              value={classFilter}
              onValueChange={(value) => {
                setClassFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={String(cls.id)}>
                    {cls.code} - {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={academicYearFilter}
              onValueChange={(value) => {
                setAcademicYearFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua tahun ajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua tahun ajaran</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={String(year.id)}>
                    {year.code} - {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setPage(1);
                loadStudents();
              }}
            >
              <Search className="mr-2 size-4" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
          <CardDescription>
            {meta
              ? `Menampilkan ${students.length} dari ${meta.total} siswa`
              : "Memuat..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <GraduationCap className="mb-2 size-8 opacity-50" />
              <p className="text-sm">Belum ada data siswa</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {students.map((student) => (
                  <div key={student.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/siswa/${student.id}`} className="block truncate font-semibold hover:underline">
                          {student.name}
                        </Link>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">NIS: {student.nis}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link to={`/siswa/${student.id}`}>
                              <Eye className="mr-2 size-4" />
                              Detail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditStudent(student.id)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setToggleStudent(student)}>
                            <Power className="mr-2 size-4" />
                            {student.is_active ? "Nonaktifkan" : "Aktifkan"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteStudent(student)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Kelas</span>
                        <span className="truncate text-right">
                          {student.active_class
                            ? `${student.active_class.code} - ${student.active_class.name}`
                            : "Belum ada kelas"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={student.is_active ? "default" : "secondary"}>
                          {student.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Dibuat</span>
                        <span className="text-right text-xs text-muted-foreground">{student.created_at}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-xl border md:block">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">NIS</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="hidden md:table-cell">Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Dibuat</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                          {student.nis}
                        </TableCell>
                        <TableCell>
                          <Link to={`/siswa/${student.id}`} className="font-medium hover:underline">
                            {student.name}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {student.active_class ? (
                            <div>
                              <p className="text-sm font-medium">{student.active_class.code}</p>
                              <p className="text-xs text-muted-foreground">{student.active_class.name}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Belum ada kelas</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.is_active ? "default" : "secondary"}>
                            {student.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          {student.created_at}
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
                                <Link to={`/siswa/${student.id}`}>
                                  <Eye className="mr-2 size-4" />
                                  Detail
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditStudent(student.id)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setToggleStudent(student)}>
                                <Power className="mr-2 size-4" />
                                {student.is_active ? "Nonaktifkan" : "Aktifkan"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteStudent(student)}
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
              </div>

              {meta && (
                <PaginationControls
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  totalItems={meta.total}
                  pageSize={pageSize}
                  itemLabel="siswa"
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Plus className="size-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Tambah Siswa Baru</DialogTitle>
                <DialogDescription>
                  Isi data lengkap siswa untuk didaftarkan ke sistem
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-2" />
          <form onSubmit={handleCreateStudent} className="space-y-6">
            {/* Identitas Siswa */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <GraduationCap className="size-4 text-primary" />
                Identitas Siswa
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="createNis" className="flex items-center gap-2 text-sm font-medium">
                    <Hash className="size-3.5 text-muted-foreground" />
                    NIS <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="createNis"
                    value={createNis}
                    onChange={(e) => setCreateNis(e.target.value)}
                    required
                    placeholder="Nomor induk siswa"
                  />
                  <p className="text-xs text-muted-foreground">Nomor unik identitas siswa</p>
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
                    placeholder="Nama siswa"
                  />
                </div>
              </div>
            </div>

            {/* Biodata Pribadi */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Calendar className="size-4 text-primary" />
                Biodata Pribadi
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
                    placeholder="Kota/kabupaten tempat lahir"
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
                    placeholder="Alamat tinggal siswa"
                  />
                </div>
              </div>
            </div>

            {/* Kontak */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="size-4 text-primary" />
                Informasi Kontak
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
                  <p className="text-xs text-muted-foreground">Opsional — untuk komunikasi</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createParentPhone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="size-3.5 text-muted-foreground" />
                    No. HP Orang Tua
                  </Label>
                  <Input
                    id="createParentPhone"
                    value={createParentPhone}
                    onChange={(e) => setCreateParentPhone(e.target.value)}
                    placeholder="0812345678"
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
                Tambah Siswa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(open) => {
        setImportOpen(open);
        if (!open) {
          setImportFile(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <UploadCloud className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Import Siswa dari Excel</DialogTitle>
                <DialogDescription>
                  Unggah file .xls atau .xlsx. Kolom minimal: NIS, Nama.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-2" />
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">File Excel</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="text-xs h-auto px-2 py-1"
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
              <p className="text-xs text-muted-foreground">File Excel (.xls, .xlsx). Baris pertama dianggap header.</p>
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              Penetapan kelas saat import sekarang mengikuti kolom <span className="font-semibold text-foreground">Kelas</span>
              di template. Gunakan <span className="font-semibold text-foreground">KODE KELAS</span> saja sesuai sheet
              <span className="font-semibold text-foreground"> Pilihan Kelas</span> pada file template.
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

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditStudent(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Pencil className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Edit Data Siswa</DialogTitle>
                <DialogDescription>
                  Perbarui profil siswa: {editStudent?.name}
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
                {/* Identitas Siswa */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <GraduationCap className="size-4 text-primary" />
                    Identitas Siswa
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="editNis" className="flex items-center gap-2 text-sm font-medium">
                        <Hash className="size-3.5 text-muted-foreground" />
                        NIS
                      </Label>
                      <Input
                        id="editNis"
                        value={editNis}
                        onChange={(e) => setEditNis(e.target.value)}
                        placeholder="Nomor induk siswa"
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
                        placeholder="Nama siswa"
                      />
                    </div>
                  </div>
                </div>

                {/* Biodata Pribadi */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Calendar className="size-4 text-primary" />
                    Biodata Pribadi
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

                {/* Kontak */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Mail className="size-4 text-primary" />
                    Informasi Kontak
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
                      <Label htmlFor="editParentPhone" className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="size-3.5 text-muted-foreground" />
                        No. HP Orang Tua
                      </Label>
                      <Input
                        id="editParentPhone"
                        value={editParentPhone}
                        onChange={(e) => setEditParentPhone(e.target.value)}
                        placeholder="0812345678"
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

      <AlertDialog open={!!toggleStudent} onOpenChange={() => setToggleStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleStudent?.is_active ? "Nonaktifkan siswa" : "Aktifkan siswa"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Status akun siswa {toggleStudent?.name} akan diubah.
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

      <AlertDialog open={!!deleteStudent} onOpenChange={() => setDeleteStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus siswa</AlertDialogTitle>
            <AlertDialogDescription>
              Data siswa {deleteStudent?.name} dan seluruh riwayat enrollment akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
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
