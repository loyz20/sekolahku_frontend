import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { subjectService } from "@/services/subjectService";
import type {
  PaginationMeta,
  SubjectDetail,
  SubjectListItem,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  BookOpen,
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  Trash2,
  Hash,
  FileText,
} from "lucide-react";

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<SubjectDetail | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [toggleSubject, setToggleSubject] = useState<SubjectListItem | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const [deleteSubject, setDeleteSubject] = useState<SubjectListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await subjectService.list({
        page,
        limit: pageSize,
        search: search || undefined,
      });
      setSubjects(res.data);
      setMeta(res.meta);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data mata pelajaran";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  function handleSearch() {
    setPage(1);
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPage(1);
    setPageSize(nextPageSize);
  }

  function resetCreateForm() {
    setCreateCode("");
    setCreateName("");
    setCreateDescription("");
  }

  async function handleCreateSubject(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      await subjectService.create({
        code: createCode,
        name: createName,
        description: createDescription || undefined,
      });
      toast.success("Mata pelajaran berhasil ditambahkan");
      setCreateOpen(false);
      resetCreateForm();
      loadSubjects();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambahkan mata pelajaran";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function openEditSubject(subjectId: number) {
    setIsLoadingEdit(true);
    setEditOpen(true);
    try {
      const res = await subjectService.getById(subjectId);
      const subject = res.data;
      setEditSubject(subject);
      setEditCode(subject.code);
      setEditName(subject.name);
      setEditDescription(subject.description ?? "");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat detail mata pelajaran";
      toast.error(message);
      setEditOpen(false);
    } finally {
      setIsLoadingEdit(false);
    }
  }

  async function handleSaveEdit() {
    if (!editSubject) return;

    const payload: Record<string, string | null> = {};
    if (editCode !== editSubject.code) payload.code = editCode;
    if (editName !== editSubject.name) payload.name = editName;
    if (editDescription !== (editSubject.description ?? "")) {
      payload.description = editDescription || null;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }

    setIsSavingEdit(true);
    try {
      await subjectService.update(editSubject.id, payload);
      toast.success("Data mata pelajaran berhasil diperbarui");
      setEditOpen(false);
      setEditSubject(null);
      loadSubjects();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui mata pelajaran";
      toast.error(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleToggleStatus() {
    if (!toggleSubject) return;
    setIsToggling(true);
    try {
      await subjectService.toggleStatus(toggleSubject.id);
      toast.success(
        toggleSubject.is_active
          ? "Mata pelajaran dinonaktifkan"
          : "Mata pelajaran diaktifkan"
      );
      setToggleSubject(null);
      loadSubjects();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengubah status mata pelajaran";
      toast.error(message);
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDeleteSubject() {
    if (!deleteSubject) return;
    setIsDeleting(true);
    try {
      await subjectService.delete(deleteSubject.id);
      toast.success("Mata pelajaran berhasil dihapus");
      setDeleteSubject(null);
      loadSubjects();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menghapus mata pelajaran";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-200/35 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Mata Pelajaran</h1>
            <p className="mt-1 text-slate-600">
              Kelola data mata pelajaran dan status aktif
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full lg:w-auto">
            <Plus className="mr-2 size-4" />
            Tambah Mata Pelajaran
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari kode atau nama mata pelajaran..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="w-full lg:w-auto">
              <Search className="mr-2 size-4" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Mata Pelajaran</CardTitle>
          <CardDescription>
            {meta
              ? `Menampilkan ${subjects.length} dari ${meta.total} mata pelajaran`
              : "Memuat..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BookOpen className="mb-2 size-8 opacity-50" />
              <p className="text-sm">Belum ada data mata pelajaran</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {subjects.map((subject) => (
                  <div key={subject.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/mapel/${subject.id}`}
                          className="block truncate font-semibold hover:underline"
                        >
                          {subject.name}
                        </Link>
                        <div className="mt-1">
                          <Badge variant="secondary">{subject.code}</Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link to={`/mapel/${subject.id}`}>
                              <Eye className="mr-2 size-4" />
                              Detail
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditSubject(subject.id)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setToggleSubject(subject)}>
                            <Power className="mr-2 size-4" />
                            {subject.is_active ? "Nonaktifkan" : "Aktifkan"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteSubject(subject)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={subject.is_active ? "default" : "secondary"}>
                          {subject.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {subject.description ? subject.description : "Tidak ada deskripsi"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-xl border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell>
                          <Badge variant="secondary">{subject.code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {subject.description ? (
                            <span className="line-clamp-2">{subject.description}</span>
                          ) : (
                            <span className="italic">Tidak ada deskripsi</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={subject.is_active ? "default" : "secondary"}
                          >
                            {subject.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link to={`/mapel/${subject.id}`}>
                                  <Eye className="mr-2 size-4" />
                                  Detail
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditSubject(subject.id)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setToggleSubject(subject)}>
                                <Power className="mr-2 size-4" />
                                {subject.is_active ? "Nonaktifkan" : "Aktifkan"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteSubject(subject)}
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
                  itemLabel="mata pelajaran"
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Subject Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Plus className="size-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Tambah Mata Pelajaran Baru</DialogTitle>
                <DialogDescription>
                  Isi data mata pelajaran untuk didaftarkan ke sistem
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-2" />
          <form onSubmit={handleCreateSubject} className="space-y-6">
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BookOpen className="size-4 text-primary" />
                Informasi Mata Pelajaran
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="createCode" className="flex items-center gap-2 text-sm font-medium">
                    <Hash className="size-3.5 text-muted-foreground" />
                    Kode <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="createCode"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    required
                    placeholder="Misal: MTK, IPA, BID"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createName" className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="size-3.5 text-muted-foreground" />
                    Nama <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="createName"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    placeholder="Nama mata pelajaran"
                    maxLength={255}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="createDescription" className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="size-3.5 text-muted-foreground" />
                  Deskripsi
                </Label>
                <Input
                  id="createDescription"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Deskripsi singkat mata pelajaran"
                  maxLength={1000}
                />
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
                Tambah Mata Pelajaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditSubject(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Pencil className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Edit Mata Pelajaran</DialogTitle>
                <DialogDescription>
                  Ubah data mata pelajaran
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-2" />
          {isLoadingEdit ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BookOpen className="size-4 text-primary" />
                  Informasi Mata Pelajaran
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editCode" className="flex items-center gap-2 text-sm font-medium">
                      <Hash className="size-3.5 text-muted-foreground" />
                      Kode
                    </Label>
                    <Input
                      id="editCode"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      placeholder="Kode mata pelajaran"
                      maxLength={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editName" className="flex items-center gap-2 text-sm font-medium">
                      <BookOpen className="size-3.5 text-muted-foreground" />
                      Nama
                    </Label>
                    <Input
                      id="editName"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nama mata pelajaran"
                      maxLength={255}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDescription" className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="size-3.5 text-muted-foreground" />
                    Deskripsi
                  </Label>
                  <Input
                    id="editDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Deskripsi singkat mata pelajaran"
                    maxLength={1000}
                  />
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
                <Button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={handleSaveEdit}
                  className="gap-2"
                >
                  {isSavingEdit && <Loader2 className="size-4 animate-spin" />}
                  <Pencil className="size-4" />
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle Status Alert */}
      <AlertDialog open={!!toggleSubject} onOpenChange={(open) => !open && setToggleSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleSubject?.is_active ? "Nonaktifkan" : "Aktifkan"} Mata Pelajaran?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan {toggleSubject?.is_active ? "menonaktifkan" : "mengaktifkan"}{" "}
              <span className="font-semibold">{toggleSubject?.name}</span>. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isToggling}
              onClick={handleToggleStatus}
              className={toggleSubject?.is_active ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {isToggling && <Loader2 className="mr-2 size-4 animate-spin" />}
              {toggleSubject?.is_active ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteSubject} onOpenChange={(open) => !open && setDeleteSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Pelajaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus <span className="font-semibold">{deleteSubject?.name}</span> ({deleteSubject?.code}). 
              Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDeleteSubject}
              className="bg-destructive hover:bg-destructive/90"
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
