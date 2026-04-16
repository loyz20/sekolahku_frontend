import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { userService } from "@/services/userService";
import { authService } from "@/services/authService";
import type { UserListItem, PaginationMeta } from "@/types";
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
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Eye,
  Pencil,
  KeyRound,
  Power,
  Trash2,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Lock,
  IdCard,
  ShieldAlert,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dutyFilter, setDutyFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Edit user dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editNip, setEditNip] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Reset password dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserListItem | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [isSavingReset, setIsSavingReset] = useState(false);

  // Toggle status confirm
  const [toggleUser, setToggleUser] = useState<UserListItem | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Delete confirm
  const [deleteUser, setDeleteUser] = useState<UserListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createNip, setCreateNip] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userService.listUsers({
        page,
        limit,
        search: search || undefined,
        duty: dutyFilter || undefined,
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data pengguna";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, dutyFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearch() {
    setPage(1);
    loadUsers();
  }

  // Edit user
  function openEdit(user: UserListItem) {
    setEditUser(user);
    setEditName(user.name);
    setEditNip(user.nip ?? "");
    setEditEmail(user.email);
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!editUser) return;
    const updates: Record<string, string> = {};
    if (editName !== editUser.name) updates.name = editName;
    if (editNip !== (editUser.nip ?? "")) updates.nip = editNip;
    if (editEmail !== editUser.email) updates.email = editEmail;
    if (Object.keys(updates).length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }
    setIsSavingEdit(true);
    try {
      await userService.updateUser(editUser.id, updates);
      toast.success("Pengguna berhasil diperbarui");
      setEditOpen(false);
      loadUsers();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui pengguna";
      toast.error(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Reset password
  function openReset(user: UserListItem) {
    setResetUser(user);
    setResetNewPassword("");
    setResetOpen(true);
  }

  async function handleResetPassword() {
    if (!resetUser) return;
    if (resetNewPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    setIsSavingReset(true);
    try {
      await userService.resetPassword(resetUser.id, {
        newPassword: resetNewPassword,
      });
      toast.success("Password berhasil direset");
      setResetOpen(false);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mereset password";
      toast.error(message);
    } finally {
      setIsSavingReset(false);
    }
  }

  // Toggle status
  async function handleToggleStatus() {
    if (!toggleUser) return;
    setIsToggling(true);
    try {
      const res = await userService.toggleStatus(toggleUser.id);
      toast.success(
        res.data.is_active ? "Pengguna diaktifkan" : "Pengguna dinonaktifkan"
      );
      setToggleUser(null);
      loadUsers();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengubah status";
      toast.error(message);
    } finally {
      setIsToggling(false);
    }
  }

  // Delete user
  async function handleDelete() {
    if (!deleteUser) return;
    setIsDeleting(true);
    try {
      await userService.deleteUser(deleteUser.id);
      toast.success("Pengguna berhasil dihapus");
      setDeleteUser(null);
      loadUsers();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menghapus pengguna";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (createPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    setIsCreating(true);
    try {
      await authService.register({
        name: createName,
        nip: createNip || undefined,
        email: createEmail,
        password: createPassword,
      });
      toast.success("Pengguna berhasil ditambahkan");
      setCreateOpen(false);
      setCreateName("");
      setCreateNip("");
      setCreateEmail("");
      setCreatePassword("");
      loadUsers();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambahkan pengguna";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Pengguna
          </h1>
          <p className="text-muted-foreground">
            Kelola akun pengguna sistem Sekolahku
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 size-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, email, atau NIP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Filter duty (misal: guru)"
              value={dutyFilter}
              onChange={(e) => setDutyFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full sm:w-48"
            />
            <Button onClick={handleSearch} className="w-full sm:w-auto">
              <Search className="mr-2 size-4" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            {meta
              ? `Menampilkan ${users.length} dari ${meta.total} pengguna`
              : "Memuat..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="mb-2 size-8 opacity-50" />
              <p className="text-sm">Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Tugas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Dibuat</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                        {user.nip ?? "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          to={`/pengguna/${user.id}`}
                          className="hover:underline"
                        >
                          {user.name}
                        </Link>
                        {user.is_protected && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-[10px]"
                          >
                            Protected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.duties.map((d) => (
                            <Badge key={d} variant="secondary" className="text-xs">
                              {d}
                            </Badge>
                          ))}
                          {user.duties.length === 0 && (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_active ? "default" : "destructive"}
                        >
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {user.created_at}
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
                              <Link to={`/pengguna/${user.id}`}>
                                <Eye className="mr-2 size-4" />
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(user)}>
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openReset(user)}>
                              <KeyRound className="mr-2 size-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setToggleUser(user)}
                            >
                              <Power className="mr-2 size-4" />
                              {user.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteUser(user)}
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

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Halaman {meta.page} dari {meta.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="mr-1 size-4" />
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Selanjutnya
                      <ChevronRight className="ml-1 size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Pencil className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Edit Pengguna</DialogTitle>
                <DialogDescription>
                  Perbarui informasi untuk {editUser?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="editName" className="flex items-center gap-2 text-sm font-medium">
                <User className="size-3.5 text-muted-foreground" />
                Nama Lengkap
              </Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                minLength={2}
                maxLength={100}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNip" className="flex items-center gap-2 text-sm font-medium">
                <IdCard className="size-3.5 text-muted-foreground" />
                NIP
              </Label>
              <Input
                id="editNip"
                value={editNip}
                onChange={(e) => setEditNip(e.target.value.replace(/\D/g, ""))}
                minLength={5}
                maxLength={30}
                placeholder="Opsional — hanya angka"
              />
              <p className="text-xs text-muted-foreground">5-30 digit angka</p>
            </div>
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
          </div>
          <Separator />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSavingEdit}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                <KeyRound className="size-5 text-amber-500" />
              </div>
              <div>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Set password baru untuk {resetUser?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          {resetUser && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <Avatar>
                <AvatarFallback className="text-xs">
                  {resetUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{resetUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">{resetUser.email}</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="resetPassword" className="flex items-center gap-2 text-sm font-medium">
              <Lock className="size-3.5 text-muted-foreground" />
              Password Baru
            </Label>
            <Input
              id="resetPassword"
              type="password"
              value={resetNewPassword}
              onChange={(e) => setResetNewPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
            />
            <p className="text-xs text-muted-foreground">
              Password akan langsung berlaku setelah reset
            </p>
          </div>
          <Separator />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResetOpen(false)} disabled={isSavingReset}>
              Batal
            </Button>
            <Button onClick={handleResetPassword} disabled={isSavingReset}>
              {isSavingReset && <Loader2 className="mr-2 size-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirm */}
      <AlertDialog
        open={!!toggleUser}
        onOpenChange={(open) => !open && setToggleUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-full ${toggleUser?.is_active ? "bg-destructive/10" : "bg-emerald-500/10"}`}>
                <Power className={`size-5 ${toggleUser?.is_active ? "text-destructive" : "text-emerald-500"}`} />
              </div>
              <div>
                <AlertDialogTitle>
                  {toggleUser?.is_active ? "Nonaktifkan" : "Aktifkan"} Pengguna?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {toggleUser?.is_active
                    ? `Pengguna "${toggleUser?.name}" tidak akan bisa login setelah dinonaktifkan.`
                    : `Pengguna "${toggleUser?.name}" akan bisa login kembali setelah diaktifkan.`}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          {toggleUser && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <Avatar>
                <AvatarFallback className="text-xs">
                  {toggleUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{toggleUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">{toggleUser.email}</p>
              </div>
              <Badge variant={toggleUser.is_active ? "default" : "destructive"}>
                {toggleUser.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={toggleUser?.is_active ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isToggling && <Loader2 className="mr-2 size-4 animate-spin" />}
              {toggleUser?.is_active ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10">
                <UserPlus className="size-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                <DialogDescription>
                  Buat akun pengguna baru dengan duty default guru
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <form onSubmit={handleCreateUser} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="createName" className="flex items-center gap-2 text-sm font-medium">
                  <User className="size-3.5 text-muted-foreground" />
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="createName"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="createNip" className="flex items-center gap-2 text-sm font-medium">
                  <IdCard className="size-3.5 text-muted-foreground" />
                  NIP
                </Label>
                <Input
                  id="createNip"
                  value={createNip}
                  onChange={(e) => setCreateNip(e.target.value.replace(/\D/g, ""))}
                  minLength={5}
                  maxLength={30}
                  placeholder="Opsional"
                />
                <p className="text-xs text-muted-foreground">5-30 digit angka</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="createEmail" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="size-3.5 text-muted-foreground" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="createEmail"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="createPassword" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="size-3.5 text-muted-foreground" />
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="createPassword"
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/50">
              <ShieldAlert className="size-4 shrink-0 text-blue-500" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Pengguna baru akan otomatis mendapatkan duty <strong>guru</strong>. Anda dapat mengubah duty melalui halaman Manajemen Tugas.
              </p>
            </div>
            <Separator />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
                Batal
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 size-4 animate-spin" />}
                <UserPlus className="mr-2 size-4" />
                Tambah Pengguna
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle>Hapus Pengguna?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          {deleteUser && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                <Avatar>
                  <AvatarFallback className="text-xs">
                    {deleteUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{deleteUser.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{deleteUser.email}</p>
                </div>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs text-destructive">
                  Pengguna beserta semua penugasan dan data wali kelasnya akan dihapus secara permanen.
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
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
