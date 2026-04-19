import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { classService } from "@/services/classService";
import { dutyService } from "@/services/dutyService";
import { userService } from "@/services/userService";
import type { ClassListItem, PaginationMeta, UserListItem } from "@/types";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PaginationControls } from "@/components/features/PaginationControls";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  MoreHorizontal,
  Plus,
  UploadCloud,
  Download,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  School,
  Hash,
  BookOpen,
  Layers,
  Check,
  ChevronsUpDown,
} from "lucide-react";

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const selectedAcademicYearId = localStorage.getItem("selectedAcademicYearId") || "";

  // Create class dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createLevel, setCreateLevel] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Import class dialog
  const [importOpen, setImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Edit class dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassListItem | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirm
  const [deleteClass, setDeleteClass] = useState<ClassListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline homeroom assignment
  const [homeroomCandidates, setHomeroomCandidates] = useState<UserListItem[]>([]);
  const [isHomeroomCandidatesLoading, setIsHomeroomCandidatesLoading] = useState(false);
  const [updatingHomeroomClassId, setUpdatingHomeroomClassId] = useState<number | null>(null);
  const [openHomeroomPickerClassId, setOpenHomeroomPickerClassId] = useState<number | null>(null);

  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await classService.list({
        page,
        limit: pageSize,
        search: search || undefined,
        level: levelFilter || undefined,
      });
      setClasses(res.data);
      setMeta(res.meta);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data kelas";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, levelFilter]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    async function loadHomeroomCandidates() {
      try {
        setIsHomeroomCandidatesLoading(true);
        const res = await userService.listUsers({ limit: 100, duty: "guru" });
        setHomeroomCandidates(res.data.filter((user) => user.is_active));
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat kandidat wali kelas";
        toast.error(message);
      } finally {
        setIsHomeroomCandidatesLoading(false);
      }
    }

    void loadHomeroomCandidates();
  }, []);

  function handleSearch() {
    setPage(1);
    loadClasses();
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPage(1);
    setPageSize(nextPageSize);
  }

  async function handleInlineHomeroomChange(cls: ClassListItem, nextUserId: string) {
    if (!selectedAcademicYearId) {
      toast.error("Pilih tahun akademik terlebih dahulu");
      return;
    }

    try {
      setUpdatingHomeroomClassId(cls.id);

      if (cls.homeroom_teacher) {
        await dutyService.revokeHomeroom({
          classId: cls.id,
          academicYearId: Number(selectedAcademicYearId),
        });
      }

      if (nextUserId !== "none") {
        await dutyService.assignHomeroom({
          userId: Number(nextUserId),
          classId: cls.id,
          academicYearId: Number(selectedAcademicYearId),
        });
      }

      toast.success("Wali kelas berhasil diperbarui");
      await loadClasses();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui wali kelas";
      toast.error(message);
    } finally {
      setUpdatingHomeroomClassId(null);
    }
  }

  // Create class
  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      await classService.create({
        code: createCode,
        name: createName,
        level: createLevel || undefined,
      });
      toast.success("Kelas berhasil ditambahkan");
      setCreateOpen(false);
      setCreateCode("");
      setCreateName("");
      setCreateLevel("");
      loadClasses();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambahkan kelas";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  // Edit class
  function openEdit(cls: ClassListItem) {
    setEditClass(cls);
    setEditCode(cls.code);
    setEditName(cls.name);
    setEditLevel(cls.level ?? "");
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!editClass) return;
    const updates: Record<string, string | null> = {};
    if (editCode !== editClass.code) updates.code = editCode;
    if (editName !== editClass.name) updates.name = editName;
    if (editLevel !== (editClass.level ?? ""))
      updates.level = editLevel || null;
    if (Object.keys(updates).length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }
    setIsSavingEdit(true);
    try {
      await classService.update(editClass.id, updates);
      toast.success("Kelas berhasil diperbarui");
      setEditOpen(false);
      loadClasses();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui kelas";
      toast.error(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Delete class
  async function handleDelete() {
    if (!deleteClass) return;
    setIsDeleting(true);
    try {
      await classService.delete(deleteClass.id);
      toast.success("Kelas berhasil dihapus");
      setDeleteClass(null);
      loadClasses();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menghapus kelas";
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
      await classService.downloadImportTemplate();
      toast.success("Template berhasil diunduh");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengunduh template";
      toast.error(message);
    }
  }

  async function handleImportClasses(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setIsImporting(true);
    try {
      const res = await classService.import(importFile);
      toast.success(`Import selesai. Berhasil: ${res.data.created}`);
      if (res.data.errors.length) {
        toast.error(`${res.data.errors.length} baris gagal diimpor`);
      }
      setImportOpen(false);
      setImportFile(null);
      loadClasses();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengimpor kelas";
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Kelas</h1>
            <p className="max-w-xl text-slate-600">
              Kelola data kelas dan pembagian rombongan belajar
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
              Tambah Kelas
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari kode atau nama kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Filter tingkat (X, XI, XII)"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full"
            />
            <Button onClick={handleSearch} className="w-full lg:w-auto">
              <Search className="mr-2 size-4" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
          <CardDescription>
            {meta
              ? `Menampilkan ${classes.length} dari ${meta.total} kelas`
              : "Memuat..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <School className="mb-2 size-8 opacity-50" />
              <p className="text-sm">Tidak ada kelas ditemukan</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {classes.map((cls) => (
                  <div key={cls.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/kelas/${cls.id}`} className="block truncate font-semibold hover:underline">
                          {cls.name}
                        </Link>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">Kode: {cls.code}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/kelas/${cls.id}`}>
                              <Eye className="mr-2 size-4" />
                              Lihat Detail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(cls)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteClass(cls)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Tingkat</span>
                        {cls.level ? (
                          <Badge variant="outline">{cls.level}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Wali Kelas</span>
                        <span className="truncate text-right">{cls.homeroom_teacher ? cls.homeroom_teacher.name : "Belum ditentukan"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Dibuat</span>
                        <span className="text-right text-xs text-muted-foreground">{cls.created_at}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-xl border md:block">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">Kode</TableHead>
                      <TableHead>Nama Kelas</TableHead>
                      <TableHead>Tingkat</TableHead>
                      <TableHead className="hidden md:table-cell">Wali Kelas</TableHead>
                      <TableHead className="hidden lg:table-cell">Dibuat</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="hidden font-mono text-sm sm:table-cell">
                          {cls.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            to={`/kelas/${cls.id}`}
                            className="hover:underline"
                          >
                            {cls.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {cls.level ? (
                            <Badge variant="outline">{cls.level}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Popover
                            open={openHomeroomPickerClassId === cls.id}
                            onOpenChange={(open) => {
                              setOpenHomeroomPickerClassId(open ? cls.id : null);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="h-9 min-w-56 justify-between"
                                disabled={
                                  isHomeroomCandidatesLoading ||
                                  isLoading ||
                                  updatingHomeroomClassId === cls.id
                                }
                              >
                                <span className="truncate text-left">
                                  {cls.homeroom_teacher ? cls.homeroom_teacher.name : "Belum ditentukan"}
                                </span>
                                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Cari guru (nama/NIP/email)..." />
                                <CommandList>
                                  <CommandEmpty>Guru tidak ditemukan.</CommandEmpty>
                                  <CommandGroup>
                                    <CommandItem
                                      value="Belum ditentukan"
                                      onSelect={() => {
                                        void handleInlineHomeroomChange(cls, "none");
                                        setOpenHomeroomPickerClassId(null);
                                      }}
                                    >
                                      Belum ditentukan
                                      {!cls.homeroom_teacher && <Check className="ml-auto size-4" />}
                                    </CommandItem>
                                    {homeroomCandidates.map((user) => {
                                      const isSelected =
                                        cls.homeroom_teacher?.name === user.name;

                                      return (
                                        <CommandItem
                                          key={user.id}
                                          value={`${user.name} ${user.nip || ""} ${user.email || ""}`}
                                          onSelect={() => {
                                            void handleInlineHomeroomChange(cls, String(user.id));
                                            setOpenHomeroomPickerClassId(null);
                                          }}
                                        >
                                          <div className="flex flex-col">
                                            <span>{user.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                              NIP: {user.nip || "-"}
                                            </span>
                                          </div>
                                          {isSelected && <Check className="ml-auto size-4" />}
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                          {cls.created_at}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-xs">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/kelas/${cls.id}`}>
                                  <Eye className="mr-2 size-4" />
                                  Lihat Detail
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(cls)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteClass(cls)}
                                className="text-destructive focus:text-destructive"
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
                  itemLabel="kelas"
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Class Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Plus className="size-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Tambah Kelas Baru</DialogTitle>
                <DialogDescription>
                  Buat kelas baru untuk rombongan belajar
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <form onSubmit={handleCreateClass} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="classCode"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Hash className="size-3.5 text-muted-foreground" />
                  Kode Kelas <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="classCode"
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value)}
                  required
                  maxLength={30}
                  placeholder="X.E-1"
                  pattern="^[a-zA-Z0-9._\-]+$"
                />
                <p className="text-xs text-muted-foreground">
                  Huruf, angka, titik (.), - dan _ saja
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="classLevel"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Layers className="size-3.5 text-muted-foreground" />
                  Tingkat
                </Label>
                <Input
                  id="classLevel"
                  value={createLevel}
                  onChange={(e) => setCreateLevel(e.target.value)}
                  maxLength={20}
                  placeholder="X, XI, XII"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="className"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <BookOpen className="size-3.5 text-muted-foreground" />
                  Nama Kelas <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="className"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="X IPA 1"
                />
              </div>
            </div>
            <Separator />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isCreating}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Tambah Kelas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                <DialogTitle>Import Kelas dari Excel</DialogTitle>
                <DialogDescription>
                  Unggah file .xls atau .xlsx. Kolom minimal: Kode, Nama.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-2" />
          <form onSubmit={handleImportClasses} className="space-y-4">
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
                Header yang didukung: Kode, Nama, Tingkat. Contoh kode: X.E-1.
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

      {/* Edit Class Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Pencil className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Edit Kelas</DialogTitle>
                <DialogDescription>
                  Perbarui informasi kelas {editClass?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="editClassCode"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Hash className="size-3.5 text-muted-foreground" />
                Kode Kelas
              </Label>
              <Input
                id="editClassCode"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                maxLength={30}
                pattern="^[a-zA-Z0-9._\-]+$"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="editClassLevel"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Layers className="size-3.5 text-muted-foreground" />
                Tingkat
              </Label>
              <Input
                id="editClassLevel"
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value)}
                maxLength={20}
                placeholder="X, XI, XII"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label
                htmlFor="editClassName"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <BookOpen className="size-3.5 text-muted-foreground" />
                Nama Kelas
              </Label>
              <Input
                id="editClassName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                minLength={2}
                maxLength={100}
              />
            </div>
          </div>
          <Separator />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isSavingEdit}
            >
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteClass}
        onOpenChange={(open) => !open && setDeleteClass(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          {deleteClass && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                <Avatar>
                  <AvatarFallback className="text-xs">
                    <School className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {deleteClass.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Kode: {deleteClass.code}
                    {deleteClass.level ? ` • Tingkat ${deleteClass.level}` : ""}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs text-destructive">
                  Kelas akan dihapus permanen. Pastikan tidak ada data wali kelas
                  yang terkait.
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && (
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
