import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { violationService } from "@/services/violationService";
import { classService } from "@/services/classService";
import { PaginationControls } from "@/components/features/PaginationControls";
import type {
  ClassListItem,
  ClassStudentItem,
  PaginationMeta,
  ViolationItem,
  ViolationSeverity,
  ViolationStudentItem,
  ViolationSummary,
  ViolationTypeItem,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

type ViolationFormState = {
  student_ids: string[];
  class_id: string;
  violation_type_id: string;
  violation_date: string;
  points: string;
  description: string;
  notes: string;
};

type ViolationEditFormState = {
  student_id: string;
  class_id: string;
  violation_type_id: string;
  violation_date: string;
  points: string;
  description: string;
  notes: string;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function emptyViolationForm(): ViolationFormState {
  return {
    student_ids: [],
    class_id: "-",
    violation_type_id: "-",
    violation_date: todayDate(),
    points: "",
    description: "",
    notes: "",
  };
}

export default function ViolationManagementPage() {
  const selectedAcademicYearId = Number(localStorage.getItem("selectedAcademicYearId") || 0);

  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationTypeItem[]>([]);
  const [studentRows, setStudentRows] = useState<ViolationStudentItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<ViolationSummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | ViolationSeverity>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<ViolationItem | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<ViolationStudentItem | null>(null);
  const [studentHistory, setStudentHistory] = useState<ViolationItem[]>([]);
  const [studentHistoryMeta, setStudentHistoryMeta] = useState<PaginationMeta | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [violationForm, setViolationForm] = useState<ViolationFormState>(emptyViolationForm());
  const [editViolationForm, setEditViolationForm] = useState<ViolationEditFormState>({
    student_id: "-",
    class_id: "-",
    violation_type_id: "-",
    violation_date: todayDate(),
    points: "",
    description: "",
    notes: "",
  });
  const [formStudents, setFormStudents] = useState<ClassStudentItem[]>([]);
  const [isLoadingFormStudents, setIsLoadingFormStudents] = useState(false);

  const activeTypes = useMemo(() => violationTypes.filter((item) => item.is_active), [violationTypes]);

  const loadReferences = useCallback(async () => {
    try {
      const [classRes, typeRes] = await Promise.all([
        classService.list({ limit: 100 }),
        violationService.listTypes({ limit: 100 }),
      ]);

      setClasses(classRes.data);
      setViolationTypes(typeRes.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat referensi pelanggaran";
      toast.error(message);
    }
  }, []);

  const loadStudentRows = useCallback(async () => {
    if (!selectedAcademicYearId) {
      setStudentRows([]);
      setMeta(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await violationService.listStudents({
        page,
        limit: pageSize,
        search: search || undefined,
        class_id: classFilter === "all" ? undefined : Number(classFilter),
        academic_year_id: selectedAcademicYearId,
        violation_type_id: typeFilter === "all" ? undefined : Number(typeFilter),
        severity: severityFilter === "all" ? undefined : severityFilter,
      });

      setStudentRows(res.data);
      setMeta(res.meta);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data pelanggaran";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, classFilter, typeFilter, severityFilter, selectedAcademicYearId]);

  const loadStudentHistory = useCallback(async (studentId: number) => {
    if (!selectedAcademicYearId) {
      setStudentHistory([]);
      setStudentHistoryMeta(null);
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const res = await violationService.list({
        page: 1,
        limit: 100,
        student_id: studentId,
        academic_year_id: selectedAcademicYearId,
      });

      setStudentHistory(res.data);
      setStudentHistoryMeta(res.meta);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat riwayat pelanggaran";
      toast.error(message);
      setStudentHistory([]);
      setStudentHistoryMeta(null);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [selectedAcademicYearId]);

  const loadSummary = useCallback(async () => {
    if (!selectedAcademicYearId) {
      setSummary(null);
      setIsLoadingSummary(false);
      return;
    }

    setIsLoadingSummary(true);
    try {
      const res = await violationService.summary({
        class_id: classFilter === "all" ? undefined : Number(classFilter),
        academic_year_id: selectedAcademicYearId,
        violation_type_id: typeFilter === "all" ? undefined : Number(typeFilter),
        severity: severityFilter === "all" ? undefined : severityFilter,
      });

      setSummary(res.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat ringkasan pelanggaran";
      toast.error(message);
      setSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [classFilter, typeFilter, severityFilter, selectedAcademicYearId]);

  const loadStudentsByClassId = useCallback(
    async (classId: number) => {
      setIsLoadingFormStudents(true);
      try {
        const detailRes = await classService.getById(classId);
        const students = detailRes.data.students.filter(
          (item) => item.enrollment.is_active && (!selectedAcademicYearId || item.enrollment.academic_year.id === selectedAcademicYearId)
        );
        setFormStudents(students);
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat siswa kelas";
        toast.error(message);
        setFormStudents([]);
      } finally {
        setIsLoadingFormStudents(false);
      }
    },
    [selectedAcademicYearId]
  );

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    void loadStudentRows();
  }, [loadStudentRows]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    setPage(1);
  }, [search, classFilter, typeFilter, severityFilter]);

  useEffect(() => {
    if (violationForm.class_id === "-") {
      setFormStudents([]);
      return;
    }

    void loadStudentsByClassId(Number(violationForm.class_id));
  }, [violationForm.class_id, loadStudentsByClassId]);

  useEffect(() => {
    if (editOpen && editViolationForm.class_id !== "-") {
      void loadStudentsByClassId(Number(editViolationForm.class_id));
    }
  }, [editOpen, editViolationForm.class_id, loadStudentsByClassId]);

  function handlePageSizeChange(next: number) {
    setPage(1);
    setPageSize(next);
  }

  function openCreateViolation() {
    if (!selectedAcademicYearId) {
      toast.error("Pilih tahun akademik terlebih dahulu.");
      return;
    }

    setViolationForm(emptyViolationForm());
    setFormStudents([]);
    setCreateOpen(true);
  }

  function openEditViolation(item: ViolationItem) {
    setSelectedViolation(item);
    setEditViolationForm({
      student_id: String(item.student.id),
      class_id: String(item.class.id),
      violation_type_id: String(item.violation_type.id),
      violation_date: item.violation_date,
      points: String(item.points),
      description: item.description,
      notes: item.notes || "",
    });
    setEditOpen(true);
  }

  function openStudentHistory(item: ViolationStudentItem) {
    setSelectedStudent(item);
    setStudentHistory([]);
    setStudentHistoryMeta(null);
    setHistoryOpen(true);
    void loadStudentHistory(item.student.id);
  }

  async function handleCreateViolation(e: React.FormEvent) {
    e.preventDefault();

    if (
      !violationForm.student_ids.length ||
      violationForm.class_id === "-" ||
      violationForm.violation_type_id === "-" ||
      !selectedAcademicYearId
    ) {
      toast.error("Lengkapi minimal satu siswa, kelas, jenis pelanggaran, dan tahun akademik.");
      return;
    }

    if (!violationForm.description.trim()) {
      toast.error("Deskripsi pelanggaran wajib diisi.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await violationService.createBulk({
        student_ids: violationForm.student_ids.map(Number),
        class_id: Number(violationForm.class_id),
        academic_year_id: selectedAcademicYearId,
        violation_type_id: Number(violationForm.violation_type_id),
        violation_date: violationForm.violation_date,
        points: violationForm.points === "" ? undefined : Number(violationForm.points),
        description: violationForm.description.trim(),
        notes: violationForm.notes.trim() || undefined,
      });

      toast.success(`Pelanggaran berhasil ditambahkan untuk ${response.data.length} siswa`);
      setCreateOpen(false);
      setViolationForm(emptyViolationForm());
      setFormStudents([]);
      void loadStudentRows();
      void loadSummary();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambah pelanggaran";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveEditViolation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedViolation) return;

    setIsSavingEdit(true);
    try {
      await violationService.update(selectedViolation.id, {
        student_id: Number(editViolationForm.student_id),
        class_id: Number(editViolationForm.class_id),
        academic_year_id: selectedAcademicYearId,
        violation_type_id: Number(editViolationForm.violation_type_id),
        violation_date: editViolationForm.violation_date,
        points: Number(editViolationForm.points) || 0,
        description: editViolationForm.description.trim(),
        notes: editViolationForm.notes.trim() || null,
      });

      toast.success("Pelanggaran berhasil diperbarui");
      setEditOpen(false);
      setSelectedViolation(null);
      void loadStudentRows();
      void loadSummary();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui pelanggaran";
      toast.error(message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteViolation() {
    if (!selectedViolation) return;

    setIsDeleting(true);
    try {
      await violationService.delete(selectedViolation.id);
      toast.success("Pelanggaran berhasil dihapus");
      setDeleteOpen(false);
      setSelectedViolation(null);
      void loadStudentRows();
      void loadSummary();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menghapus pelanggaran";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pelanggaran Siswa</h1>
          <p className="text-muted-foreground">Kelola data pelanggaran siswa dan master jenis pelanggaran.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openCreateViolation}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Pelanggaran
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Ringkasan Pelanggaran
          </CardTitle>
          <CardDescription>Ringkasan mengikuti filter data dan tahun akademik aktif.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSummary ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !summary ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Ringkasan belum tersedia.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Total Pelanggaran</p>
                <p className="mt-1 text-xl font-semibold">{summary.total}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Total Poin</p>
                <p className="mt-1 text-xl font-semibold">{summary.total_points}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Ringan</p>
                <p className="mt-1 text-xl font-semibold">{summary.by_severity.minor}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Sedang</p>
                <p className="mt-1 text-xl font-semibold">{summary.by_severity.moderate}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Berat</p>
                <p className="mt-1 text-xl font-semibold">{summary.by_severity.severe}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Pelanggaran</CardTitle>
          <CardDescription>Filter dan kelola pelanggaran siswa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Cari siswa (nama/NIS) atau deskripsi"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                {classes.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.code} - {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua jenis</SelectItem>
                {violationTypes.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as "all" | ViolationSeverity)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua tingkat</SelectItem>
                {(["minor", "moderate", "severe"] as ViolationSeverity[]).map((item) => (
                  <SelectItem key={item} value={item}>
                    {SEVERITY_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center rounded-xl border py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : studentRows.length ? (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Total Riwayat</TableHead>
                    <TableHead>Total Poin</TableHead>
                    <TableHead>Pelanggaran Terakhir</TableHead>
                    <TableHead>Tanggal Terakhir</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentRows.map((item) => (
                    <TableRow key={`${item.student.id}-${item.class.id}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{item.student.name}</p>
                          <p className="text-xs text-muted-foreground">NIS: {item.student.nis}</p>
                          <p className="text-xs text-muted-foreground">{item.academic_year.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{item.class.code}</p>
                          <p className="text-xs text-muted-foreground">{item.class.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.total_violations} kali</Badge>
                      </TableCell>
                      <TableCell>{item.total_points}</TableCell>
                      <TableCell>
                        {item.latest_violation_type ? (
                          <div className="space-y-1">
                            <Badge className={SEVERITY_BADGE_CLASS[item.latest_violation_type.severity]}>
                              {item.latest_violation_type.name}
                            </Badge>
                            <p className="text-xs text-muted-foreground">{SEVERITY_LABEL[item.latest_violation_type.severity]}</p>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{item.last_violation_date ? formatDate(item.last_violation_date) : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openStudentHistory(item)}>
                            Detail Riwayat
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              Belum ada data pelanggaran.
            </div>
          )}

          {meta ? (
            <PaginationControls
              currentPage={meta.page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              pageSize={meta.limit}
              itemLabel="pelanggaran"
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pelanggaran</DialogTitle>
            <DialogDescription>Input pelanggaran siswa baru.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateViolation}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={violationForm.class_id}
                  onValueChange={(value) => setViolationForm((prev) => ({ ...prev, class_id: value, student_ids: [] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Pilih kelas</SelectItem>
                    {classes.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.code} - {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Siswa</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setViolationForm((prev) => ({
                        ...prev,
                        student_ids: formStudents.map((item) => String(item.id)),
                      }))
                    }
                    disabled={violationForm.class_id === "-" || !formStudents.length}
                  >
                    Pilih Semua
                  </Button>
                </div>
                <div className="rounded-xl border bg-white/80 p-3">
                  {violationForm.class_id === "-" ? (
                    <p className="text-sm text-muted-foreground">Pilih kelas terlebih dahulu.</p>
                  ) : isLoadingFormStudents ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat siswa...
                    </div>
                  ) : !formStudents.length ? (
                    <p className="text-sm text-muted-foreground">Tidak ada siswa aktif di kelas ini.</p>
                  ) : (
                    <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                      {formStudents.map((item) => {
                        const checked = violationForm.student_ids.includes(String(item.id));

                        return (
                          <label
                            key={item.id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 hover:bg-muted/40"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(nextChecked) => {
                                setViolationForm((prev) => ({
                                  ...prev,
                                  student_ids: nextChecked
                                    ? [...prev.student_ids, String(item.id)]
                                    : prev.student_ids.filter((studentId) => studentId !== String(item.id)),
                                }));
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">NIS: {item.nis}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                {violationForm.student_ids.length ? (
                  <p className="text-xs text-muted-foreground">
                    {violationForm.student_ids.length} siswa dipilih.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Jenis Pelanggaran</Label>
                <Select
                  value={violationForm.violation_type_id}
                  onValueChange={(value) => {
                    setViolationForm((prev) => ({ ...prev, violation_type_id: value }));
                    const type = activeTypes.find((item) => String(item.id) === value);
                    if (type) {
                      setViolationForm((prev) => ({ ...prev, points: String(type.default_points) }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Pilih jenis</SelectItem>
                    {activeTypes.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Pelanggaran</Label>
                <Input
                  type="date"
                  value={violationForm.violation_date}
                  onChange={(e) => setViolationForm((prev) => ({ ...prev, violation_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Poin</Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={violationForm.points}
                onChange={(e) => setViolationForm((prev) => ({ ...prev, points: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={violationForm.description}
                onChange={(e) => setViolationForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Contoh: Tidak memakai atribut lengkap saat upacara"
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={violationForm.notes}
                onChange={(e) => setViolationForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Catatan tambahan"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={historyOpen}
        onOpenChange={(open) => {
          setHistoryOpen(open);
          if (!open) {
            setSelectedStudent(null);
            setStudentHistory([]);
            setStudentHistoryMeta(null);
          }
        }}
      >
        <DialogContent className="flex max-h-[88vh] w-[96vw] max-w-6xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Riwayat Pelanggaran Siswa</DialogTitle>
            <DialogDescription>
              {selectedStudent ? `${selectedStudent.student.name} - ${selectedStudent.student.nis}` : "Riwayat pelanggaran"}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : studentHistory.length ? (
              <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Total Riwayat</p>
                  <p className="mt-1 text-xl font-semibold">{selectedStudent?.total_violations ?? studentHistory.length}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Total Poin</p>
                  <p className="mt-1 text-xl font-semibold">{selectedStudent?.total_points ?? 0}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">Kelas</p>
                  <p className="mt-1 text-sm font-semibold">{selectedStudent?.class.code} - {selectedStudent?.class.name}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Poin</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Dicatat Oleh</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.violation_date)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{item.violation_type.name}</p>
                            <Badge className={SEVERITY_BADGE_CLASS[item.violation_type.severity]}>
                              {SEVERITY_LABEL[item.violation_type.severity]}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{item.points}</TableCell>
                        <TableCell className="max-w-[320px]">
                          <p className="break-words text-sm whitespace-pre-wrap">{item.description}</p>
                          {item.notes ? <p className="mt-1 break-words text-xs text-muted-foreground whitespace-pre-wrap">{item.notes}</p> : null}
                        </TableCell>
                        <TableCell className="max-w-[180px] break-words">{item.recorded_by?.name ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setHistoryOpen(false);
                                openEditViolation(item);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedViolation(item);
                                setHistoryOpen(false);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {studentHistoryMeta && studentHistoryMeta.total > studentHistory.length ? (
                <p className="text-xs text-muted-foreground">
                  Menampilkan {studentHistory.length} dari {studentHistoryMeta.total} riwayat.
                </p>
              ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                Belum ada riwayat pelanggaran untuk siswa ini.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setHistoryOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pelanggaran</DialogTitle>
            <DialogDescription>Perbarui data pelanggaran siswa.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSaveEditViolation}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={editViolationForm.class_id}
                  onValueChange={(value) => setEditViolationForm((prev) => ({ ...prev, class_id: value, student_id: "-" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Pilih kelas</SelectItem>
                    {classes.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.code} - {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Siswa</Label>
                <Select value={editViolationForm.student_id} onValueChange={(value) => setEditViolationForm((prev) => ({ ...prev, student_id: value }))}>
                  <SelectTrigger disabled={editViolationForm.class_id === "-" || isLoadingFormStudents}>
                    <SelectValue placeholder="Pilih siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Pilih siswa</SelectItem>
                    {formStudents.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.nis} - {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Jenis Pelanggaran</Label>
                <Select
                  value={editViolationForm.violation_type_id}
                  onValueChange={(value) => setEditViolationForm((prev) => ({ ...prev, violation_type_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Pilih jenis</SelectItem>
                    {activeTypes.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Pelanggaran</Label>
                <Input
                  type="date"
                  value={editViolationForm.violation_date}
                  onChange={(e) => setEditViolationForm((prev) => ({ ...prev, violation_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Poin</Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={editViolationForm.points}
                onChange={(e) => setEditViolationForm((prev) => ({ ...prev, points: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={editViolationForm.description}
                onChange={(e) => setEditViolationForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={editViolationForm.notes}
                onChange={(e) => setEditViolationForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSavingEdit}>
                {isSavingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              Hapus Pelanggaran
            </AlertDialogTitle>
            <AlertDialogDescription>
              Data pelanggaran untuk siswa <span className="font-semibold">{selectedViolation?.student.name}</span> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteViolation} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}