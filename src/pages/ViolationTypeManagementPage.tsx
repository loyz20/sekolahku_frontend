import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { violationService } from "@/services/violationService";
import { useAuthStore } from "@/stores/authStore";
import { hasDuty } from "@/lib/roles";
import type { ViolationSeverity, ViolationTypeItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

const SEVERITY_LABEL: Record<ViolationSeverity, string> = {
  minor: "Ringan",
  moderate: "Sedang",
  severe: "Berat",
};

const SEVERITY_BADGE_CLASS: Record<ViolationSeverity, string> = {
  minor: "border-sky-200 bg-sky-50 text-sky-700",
  moderate: "border-amber-200 bg-amber-50 text-amber-700",
  severe: "border-rose-200 bg-rose-50 text-rose-700",
};

type ViolationTypeFormState = {
  name: string;
  severity: ViolationSeverity;
  default_points: string;
  description: string;
  is_active: boolean;
};

function emptyTypeForm(): ViolationTypeFormState {
  return {
    name: "",
    severity: "minor",
    default_points: "0",
    description: "",
    is_active: true,
  };
}

export default function ViolationTypeManagementPage() {
  const user = useAuthStore((s) => s.user);
  const canManageViolationTypes = hasDuty(user?.duties, "admin");

  const [violationTypes, setViolationTypes] = useState<ViolationTypeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedType, setSelectedType] = useState<ViolationTypeItem | null>(null);
  const [typeForm, setTypeForm] = useState<ViolationTypeFormState>(emptyTypeForm());
  const [isSavingType, setIsSavingType] = useState(false);
  const [isDeletingType, setIsDeletingType] = useState(false);

  const activeTypeCount = useMemo(
    () => violationTypes.filter((item) => item.is_active).length,
    [violationTypes]
  );

  const loadTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await violationService.listTypes({ limit: 100 });
      setViolationTypes(res.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat master jenis pelanggaran";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  function openCreateType() {
    setTypeForm(emptyTypeForm());
    setCreateOpen(true);
  }

  function openEditType(item: ViolationTypeItem) {
    setSelectedType(item);
    setTypeForm({
      name: item.name,
      severity: item.severity,
      default_points: String(item.default_points),
      description: item.description || "",
      is_active: item.is_active,
    });
    setEditOpen(true);
  }

  async function handleCreateType(e: React.FormEvent) {
    e.preventDefault();

    if (!typeForm.name.trim()) {
      toast.error("Nama jenis pelanggaran wajib diisi.");
      return;
    }

    setIsSavingType(true);
    try {
      await violationService.createType({
        name: typeForm.name.trim(),
        severity: typeForm.severity,
        default_points: Number(typeForm.default_points) || 0,
        description: typeForm.description.trim() || undefined,
        is_active: typeForm.is_active,
      });

      toast.success("Jenis pelanggaran berhasil ditambahkan");
      setCreateOpen(false);
      setTypeForm(emptyTypeForm());
      await loadTypes();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambah jenis pelanggaran";
      toast.error(message);
    } finally {
      setIsSavingType(false);
    }
  }

  async function handleSaveEditType(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;

    setIsSavingType(true);
    try {
      await violationService.updateType(selectedType.id, {
        name: typeForm.name.trim(),
        severity: typeForm.severity,
        default_points: Number(typeForm.default_points) || 0,
        description: typeForm.description.trim() || null,
        is_active: typeForm.is_active,
      });

      toast.success("Jenis pelanggaran berhasil diperbarui");
      setEditOpen(false);
      setSelectedType(null);
      await loadTypes();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui jenis pelanggaran";
      toast.error(message);
    } finally {
      setIsSavingType(false);
    }
  }

  async function handleDeleteType() {
    if (!selectedType) return;

    setIsDeletingType(true);
    try {
      await violationService.deleteType(selectedType.id);
      toast.success("Jenis pelanggaran berhasil dihapus");
      setDeleteOpen(false);
      setSelectedType(null);
      await loadTypes();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menghapus jenis pelanggaran";
      toast.error(message);
    } finally {
      setIsDeletingType(false);
    }
  }

  if (!canManageViolationTypes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Akses Ditolak</CardTitle>
          <CardDescription>
            Halaman master jenis pelanggaran hanya dapat diakses oleh admin.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Master Jenis Pelanggaran</h1>
          <p className="text-muted-foreground">Kelola jenis pelanggaran, severity, dan poin default.</p>
        </div>
        <Button variant="outline" onClick={openCreateType}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jenis
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Data Master
          </CardTitle>
          <CardDescription>
            Total jenis: {violationTypes.length} | Aktif: {activeTypeCount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
            Kode jenis pelanggaran dibuat otomatis dengan format <span className="font-semibold text-foreground">VT-001</span>, <span className="font-semibold text-foreground">VT-002</span>, dan seterusnya.
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !violationTypes.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Belum ada jenis pelanggaran.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead className="text-right">Poin Default</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violationTypes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge className={`border ${SEVERITY_BADGE_CLASS[item.severity]}`}>
                        {SEVERITY_LABEL[item.severity]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.default_points}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "secondary" : "outline"}>
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditType(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedType(item);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Jenis Pelanggaran</DialogTitle>
            <DialogDescription>Tambah master jenis pelanggaran.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateType}>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={typeForm.name} onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tingkat</Label>
                <Select value={typeForm.severity} onValueChange={(value) => setTypeForm((prev) => ({ ...prev, severity: value as ViolationSeverity }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Ringan</SelectItem>
                    <SelectItem value="moderate">Sedang</SelectItem>
                    <SelectItem value="severe">Berat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Poin Default</Label>
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  value={typeForm.default_points}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, default_points: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={typeForm.description} onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSavingType}>
                {isSavingType && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Jenis Pelanggaran</DialogTitle>
            <DialogDescription>Perbarui master jenis pelanggaran.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSaveEditType}>
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input value={selectedType?.code || "-"} disabled />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama</Label>
                <Input value={typeForm.name} onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tingkat</Label>
                <Select value={typeForm.severity} onValueChange={(value) => setTypeForm((prev) => ({ ...prev, severity: value as ViolationSeverity }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Ringan</SelectItem>
                    <SelectItem value="moderate">Sedang</SelectItem>
                    <SelectItem value="severe">Berat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Poin Default</Label>
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  value={typeForm.default_points}
                  onChange={(e) => setTypeForm((prev) => ({ ...prev, default_points: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={typeForm.description} onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label htmlFor="type-active">Status Aktif</Label>
              <Button
                id="type-active"
                type="button"
                variant={typeForm.is_active ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
              >
                {typeForm.is_active ? "Aktif" : "Nonaktif"}
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSavingType}>
                {isSavingType && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Hapus Jenis Pelanggaran
            </AlertDialogTitle>
            <AlertDialogDescription>
              Jenis <span className="font-semibold">{selectedType?.name}</span> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteType} disabled={isDeletingType}>
              {isDeletingType && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
