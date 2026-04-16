import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  Users,
  CheckCircle2,
} from "lucide-react";
import { scheduleService } from "@/services/scheduleService";
import { classService } from "@/services/classService";
import { teacherService } from "@/services/teacherService";
import { academicYearService } from "@/services/academicYearService";
import type { ClassSubjectMapping, TeachingAssignment } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useNotification } from "@/hooks/use-notification";
import { useAuthStore } from "@/stores/authStore";

export default function TeachingAssignmentPage() {
  const { notify } = useNotification();
  const user = useAuthStore((s) => s.user);
  const isSuperadmin = Boolean(user?.duties?.includes("superadmin"));
  const [page, setPage] = useState(1);
  const limit = 10;

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeachingAssignment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    teacher_id: "",
    subject_id: "",
    class_subject_ids: [] as string[],
    notes: "",
  });

  const resetCreateForm = () => {
    setFormData({
      teacher_id: "",
      subject_id: "",
      class_subject_ids: [],
      notes: "",
    });
  };

  // Filters
  const [filterClassId, setFilterClassId] = useState("");
  const [filterTeacherId, setFilterTeacherId] = useState("");
  const [filterAcademicYearId, setFilterAcademicYearId] = useState("");

  // Fetch data
  const { data: classesData } = useQuery({
    queryKey: ["classes", { limit: 100 }],
    queryFn: () => classService.list({ limit: 100 }),
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers", { limit: 100 }],
    queryFn: () => teacherService.list({ limit: 100 }),
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ["academicYears", { limit: 100 }],
    queryFn: () => academicYearService.list({ limit: 100 }),
  });

  const { data: classSubjectsData } = useQuery({
    queryKey: ["classSubjects", { limit: 100, include_inactive: false }],
    queryFn: () =>
      scheduleService.listClassSubjects({
        limit: 100,
        include_inactive: false,
      }),
  });

  const { data: assignmentsData, isLoading, refetch } = useQuery({
    queryKey: [
      "teachingAssignments",
      { page, limit, filterClassId, filterTeacherId, filterAcademicYearId },
    ],
    queryFn: () =>
      scheduleService.listTeachingAssignments({
        page,
        limit,
        class_id: filterClassId ? parseInt(filterClassId) : undefined,
        teacher_id: filterTeacherId ? parseInt(filterTeacherId) : undefined,
        academic_year_id: filterAcademicYearId
          ? parseInt(filterAcademicYearId)
          : undefined,
        include_inactive: true,
      }),
  });

  // Handlers
  const handleCreate = async () => {
    if (!formData.teacher_id || !formData.subject_id || formData.class_subject_ids.length === 0) {
      notify("error", "Guru, mata pelajaran, dan kelas harus diisi");
      return;
    }

    try {
      let createdCount = 0;
      let conflictCount = 0;
      let failedCount = 0;
      let firstErrorMessage = "";

      for (const classSubjectId of formData.class_subject_ids) {
        try {
          await scheduleService.createTeachingAssignment({
            class_subject_id: parseInt(classSubjectId),
            teacher_id: parseInt(formData.teacher_id),
            notes: formData.notes || undefined,
          });
          createdCount += 1;
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Gagal menambahkan penugasan guru";

          if (message.toLowerCase().includes("already")) {
            conflictCount += 1;
            continue;
          }

          failedCount += 1;
          if (!firstErrorMessage) {
            firstErrorMessage = message;
          }
        }
      }

      if (createdCount > 0) {
        notify("success", `${createdCount} penugasan guru berhasil ditambahkan`);
      }

      if (conflictCount > 0) {
        notify("warning", `${conflictCount} kelas dilewati karena sudah memiliki penugasan aktif`);
      }

      if (failedCount > 0) {
        notify("error", firstErrorMessage || `${failedCount} penugasan gagal dibuat`);
      }

      if (createdCount === 0) {
        return;
      }

      setShowCreateDialog(false);
      resetCreateForm();
      refetch();
    } catch {
      notify("error", "Gagal menambahkan penugasan guru");
    }
  };

  const handleRevoke = async () => {
    if (!selectedAssignment) return;

    try {
      await scheduleService.revokeTeachingAssignment(selectedAssignment.id);
      notify("success", "Penugasan guru berhasil dihapus");
      setShowDeleteDialog(false);
      setSelectedAssignment(null);
      refetch();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal menghapus penugasan guru";
      notify("error", message);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedAssignment) return;

    try {
      await scheduleService.deleteTeachingAssignment(selectedAssignment.id);
      notify("success", "Penugasan guru berhasil dihapus permanen");
      setShowDeleteDialog(false);
      setSelectedAssignment(null);
      refetch();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal menghapus penugasan guru secara permanen";
      notify("error", message);
    }
  };

  const totalPages = Math.ceil(
    (assignmentsData?.meta?.total || 0) / limit
  );

  const selectableClassSubjects = useMemo<ClassSubjectMapping[]>(
    () => classSubjectsData?.data?.filter((item) => item.is_active) ?? [],
    [classSubjectsData?.data]
  );

  const availableSubjects = useMemo(
    () =>
      Array.from(
        new Map(
          selectableClassSubjects.map((item) => [
            item.subject.id,
            { id: item.subject.id, code: item.subject.code, name: item.subject.name },
          ])
        ).values()
      ),
    [selectableClassSubjects]
  );

  const selectableClassesBySubject = useMemo(
    () =>
      selectableClassSubjects.filter(
        (item) => item.subject.id.toString() === formData.subject_id
      ),
    [selectableClassSubjects, formData.subject_id]
  );

  const selectedTeacher = useMemo(
    () => teachersData?.data?.find((t) => t.id.toString() === formData.teacher_id),
    [teachersData?.data, formData.teacher_id]
  );

  const selectedSubject = useMemo(
    () => availableSubjects.find((s) => s.id.toString() === formData.subject_id),
    [availableSubjects, formData.subject_id]
  );

  const selectedClasses = useMemo(
    () =>
      selectableClassesBySubject.filter((item) =>
        formData.class_subject_ids.includes(item.id.toString())
      ),
    [selectableClassesBySubject, formData.class_subject_ids]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/jadwal">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Manajemen Penugasan Guru
          </h1>
          <p className="mt-2 text-gray-600">
            Kelola penugasan guru ke mata pelajaran kelas
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Penugasan Guru
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select
                value={filterClassId || "all"}
                onValueChange={(value) =>
                  setFilterClassId(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kelas</SelectItem>
                  {classesData?.data?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.code} - {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Guru</Label>
              <Select
                value={filterTeacherId || "all"}
                onValueChange={(value) =>
                  setFilterTeacherId(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua guru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua guru</SelectItem>
                  {teachersData?.data?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tahun Akademik</Label>
              <Select
                value={filterAcademicYearId || "all"}
                onValueChange={(value) =>
                  setFilterAcademicYearId(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua tahun</SelectItem>
                  {academicYearsData?.data?.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Penugasan Guru</CardTitle>
          <CardDescription>
            Total: {assignmentsData?.meta?.total || 0} penugasan guru
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : assignmentsData?.data?.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tidak ada data penugasan guru yang sesuai dengan filter
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guru</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead className="hidden md:table-cell">Mata Pelajaran</TableHead>
                      <TableHead className="hidden lg:table-cell">Tahun Akademik</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Tanggal Penugasan</TableHead>
                      <TableHead className="hidden lg:table-cell">Catatan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentsData?.data?.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-semibold">
                          {assignment.teacher.name}
                        </TableCell>
                        <TableCell>{assignment.class.code}</TableCell>
                        <TableCell className="hidden md:table-cell">{assignment.subject.name}</TableCell>
                        <TableCell className="hidden lg:table-cell">{assignment.academic_year.code}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.is_active ? "default" : "secondary"
                            }
                          >
                            {assignment.is_active ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-sm text-gray-600 md:table-cell">
                          {new Date(assignment.assigned_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </TableCell>
                        <TableCell className="hidden text-sm lg:table-cell">
                          {assignment.notes ? (
                            <span className="max-w-xs truncate">
                              {assignment.notes}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(Math.max(1, page - 1))}
                          className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <PaginationItem key={p}>
                            <PaginationLink
                              onClick={() => setPage(p)}
                              isActive={page === p}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage(Math.min(totalPages, page + 1))
                          }
                          className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            resetCreateForm();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-125">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" />
              Tambah Penugasan Guru
            </DialogTitle>
            <DialogDescription>
              Ikuti langkah ini: pilih guru, pilih mata pelajaran, lalu centang satu atau beberapa kelas.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-13rem)] space-y-5 overflow-y-auto pr-1">
            <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
              Anda bisa menugaskan 1 guru ke beberapa kelas sekaligus untuk mata pelajaran yang sama.
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher-select">1. Pilih Guru</Label>
              <Select
                value={formData.teacher_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, teacher_id: value })
                }
              >
                <SelectTrigger id="teacher-select">
                  <SelectValue placeholder="Pilih guru" />
                </SelectTrigger>
                <SelectContent>
                  {teachersData?.data?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name} ({teacher.nip})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject-select">2. Pilih Mata Pelajaran</Label>
              <Select
                value={formData.subject_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, subject_id: value, class_subject_ids: [] })
                }
              >
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="Pilih mata pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>3. Pilih Kelas (Bisa lebih dari 1)</Label>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3">
                {selectableClassesBySubject.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Pilih mata pelajaran terlebih dahulu untuk menampilkan kelas.
                  </p>
                ) : (
                  selectableClassesBySubject.map((item) => {
                    const value = item.id.toString();
                    const checked = formData.class_subject_ids.includes(value);

                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(isChecked) => {
                            setFormData((prev) => ({
                              ...prev,
                              class_subject_ids: isChecked
                                ? [...prev.class_subject_ids, value]
                                : prev.class_subject_ids.filter((id) => id !== value),
                            }));
                          }}
                        />
                        <span className="text-sm">
                          {item.class.code} - {item.class.name} ({item.academic_year.code})
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-700">Ringkasan Penugasan</p>
              <p>
                <span className="font-semibold">Guru:</span>{" "}
                {selectedTeacher ? `${selectedTeacher.name} (${selectedTeacher.nip})` : "Belum dipilih"}
              </p>
              <p>
                <span className="font-semibold">Mapel:</span>{" "}
                {selectedSubject ? `${selectedSubject.code} - ${selectedSubject.name}` : "Belum dipilih"}
              </p>
              <p>
                <span className="font-semibold">Jumlah Kelas:</span>{" "}
                {selectedClasses.length > 0 ? `${selectedClasses.length} kelas` : "Belum dipilih"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Masukkan catatan tambahan..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="min-h-25"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetCreateForm();
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.teacher_id ||
                !formData.subject_id ||
                formData.class_subject_ids.length === 0
              }
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Simpan {formData.class_subject_ids.length > 0 ? `${formData.class_subject_ids.length} Penugasan` : "Penugasan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {isSuperadmin ? "Kelola Penghapusan Penugasan Guru" : "Hapus Penugasan Guru"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isSuperadmin
                  ? "Anda bisa memilih menonaktifkan (revoke) atau menghapus permanen penugasan ini."
                  : "Apakah Anda yakin ingin menonaktifkan penugasan guru ini?"}
              </AlertDescription>
            </Alert>

            {selectedAssignment && (
              <div className="space-y-2 rounded-md bg-gray-50 p-4 text-sm">
                <p>
                  <span className="font-semibold">Guru:</span>{" "}
                  {selectedAssignment.teacher.name}
                </p>
                <p>
                  <span className="font-semibold">Kelas:</span>{" "}
                  {selectedAssignment.class.code}
                </p>
                <p>
                  <span className="font-semibold">Mapel:</span>{" "}
                  {selectedAssignment.subject.name}
                </p>
                <p>
                  <span className="font-semibold">Tahun:</span>{" "}
                  {selectedAssignment.academic_year.code}
                </p>
                {selectedAssignment.notes && (
                  <p>
                    <span className="font-semibold">Catatan:</span>{" "}
                    {selectedAssignment.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedAssignment(null);
              }}
            >
              Batal
            </Button>
            {isSuperadmin ? (
              <>
                <Button variant="secondary" onClick={handleRevoke}>
                  Revoke
                </Button>
                <Button variant="destructive" onClick={handlePermanentDelete}>
                  Hapus Permanen
                </Button>
              </>
            ) : (
              <Button variant="destructive" onClick={handleRevoke}>
                Revoke
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
