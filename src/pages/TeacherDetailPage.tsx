import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { teacherService } from "@/services/teacherService";
import { scheduleService } from "@/services/scheduleService";
import { useNotification } from "@/hooks/use-notification";
import type { ClassSubjectMapping, TeacherDetail, TeachingAssignment } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft,
  Loader2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Users,
  Mail,
  Shield,
  School,
  Calendar,
  Briefcase,
  Phone,
  MapPin,
  User as UserIcon,
} from "lucide-react";

export default function TeacherDetailPage() {
  const { notify } = useNotification();
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectMapping[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [isRevokingAssignment, setIsRevokingAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeachingAssignment | null>(null);
  const selectedAcademicYearId = localStorage.getItem("selectedAcademicYearId") || "";
  const selectedAcademicYearName =
    localStorage.getItem("selectedAcademicYearName") || "Belum dipilih";
  const [formData, setFormData] = useState({
    subject_id: "",
    class_subject_ids: [] as string[],
    notes: "",
  });

  const resetCreateForm = () => {
    setFormData({
      subject_id: "",
      class_subject_ids: [],
      notes: "",
    });
  };

  const loadTeachingData = useCallback(
    async (teacherId: number) => {
      if (!selectedAcademicYearId) {
        setTeachingAssignments([]);
        setClassSubjects([]);
        return;
      }

      setIsAssignmentsLoading(true);
      try {
        const [classSubjectsRes, assignmentsRes] = await Promise.all([
          scheduleService.listClassSubjects({
            academic_year_id: Number(selectedAcademicYearId),
            include_inactive: false,
            limit: 100,
          }),
          scheduleService.listTeachingAssignments({
            teacher_id: teacherId,
            academic_year_id: Number(selectedAcademicYearId),
            include_inactive: true,
            limit: 100,
          }),
        ]);

        setClassSubjects(classSubjectsRes.data.filter((item) => item.is_active));
        setTeachingAssignments(assignmentsRes.data);
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat penugasan guru";
        toast.error(message);
      } finally {
        setIsAssignmentsLoading(false);
      }
    },
    [selectedAcademicYearId]
  );

  useEffect(() => {
    if (!id) return;
    loadTeacher(Number(id));
    loadTeachingData(Number(id));
  }, [id, loadTeachingData]);

  async function loadTeacher(teacherId: number) {
    setIsLoading(true);
    try {
      const res = await teacherService.getById(teacherId);
      setTeacher(res.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data guru";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  const availableSubjects = useMemo(
    () =>
      Array.from(
        new Map(
          classSubjects.map((item) => [
            item.subject.id,
            { id: item.subject.id, code: item.subject.code, name: item.subject.name },
          ])
        ).values()
      ),
    [classSubjects]
  );

  const selectableClassesBySubject = useMemo(
    () =>
      classSubjects.filter(
        (item) => item.subject.id.toString() === formData.subject_id
      ),
    [classSubjects, formData.subject_id]
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

  const handleCreateTeachingAssignment = async () => {
    if (!teacher) return;

    if (!selectedAcademicYearId) {
      notify("error", "Tahun ajaran login tidak ditemukan");
      return;
    }

    if (!formData.subject_id || formData.class_subject_ids.length === 0) {
      notify("error", "Mata pelajaran dan kelas harus dipilih");
      return;
    }

    setIsCreatingAssignment(true);
    try {
      let createdCount = 0;
      let conflictCount = 0;
      let failedCount = 0;
      let firstErrorMessage = "";

      for (const classSubjectId of formData.class_subject_ids) {
        try {
          await scheduleService.createTeachingAssignment({
            class_subject_id: parseInt(classSubjectId),
            teacher_id: teacher.id,
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
      await loadTeachingData(teacher.id);
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  const handleRevokeTeachingAssignment = async () => {
    if (!teacher || !selectedAssignment) return;

    setIsRevokingAssignment(true);
    try {
      await scheduleService.revokeTeachingAssignment(selectedAssignment.id);
      notify("success", "Penugasan guru berhasil dicabut");
      setShowRevokeDialog(false);
      setSelectedAssignment(null);
      await loadTeachingData(teacher.id);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal mencabut penugasan guru";
      notify("error", message);
    } finally {
      setIsRevokingAssignment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/guru">
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Briefcase className="mb-2 size-8 opacity-50" />
            <p className="text-sm">Guru tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/guru">
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Link>
        </Button>
        <Button
          onClick={() => {
            resetCreateForm();
            setShowCreateDialog(true);
          }}
          className="gap-2"
          disabled={!selectedAcademicYearId}
        >
          <Plus className="size-4" />
          Tambah Penugasan Guru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Briefcase className="size-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{teacher.name}</CardTitle>
              <CardDescription>NIP: {teacher.nip}</CardDescription>
            </div>
            <Badge variant={teacher.is_active ? "default" : "secondary"} className="ml-auto">
              {teacher.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <UserIcon className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="text-sm font-medium">
                  {teacher.gender === "M"
                    ? "Laki-laki"
                    : teacher.gender === "F"
                      ? "Perempuan"
                      : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tanggal Lahir</p>
                <p className="text-sm font-medium">{teacher.date_of_birth ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Phone className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">No. HP</p>
                <p className="text-sm font-medium">{teacher.phone ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{teacher.email ?? "-"}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg border p-3">
            <MapPin className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Alamat</p>
              <p className="text-sm">{teacher.address ?? "-"}</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2 rounded-lg border bg-blue-50 p-3 dark:bg-blue-950/50">
              <Briefcase className="mt-0.5 size-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Mata Pelajaran/Keahlian</p>
                <p className="text-sm font-medium">{teacher.specialization ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border bg-amber-50 p-3 dark:bg-amber-950/50">
              <Briefcase className="mt-0.5 size-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Kualifikasi Pendidikan</p>
                <p className="text-sm font-medium">{teacher.qualification ?? "-"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Penugasan Guru */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" />
                Daftar Penugasan Guru
              </CardTitle>
              <CardDescription>
                Penugasan mengajar guru ini pada tahun ajaran login
              </CardDescription>
            </div>
            <Badge variant="secondary">Tahun Ajaran: {selectedAcademicYearName}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedAcademicYearId ? (
            <Alert>
              <AlertDescription>
                Tahun ajaran login belum ditemukan. Silakan logout lalu login ulang.
              </AlertDescription>
            </Alert>
          ) : isAssignmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : teachingAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="mb-2 size-8 opacity-50" />
              <p className="text-sm">Belum ada penugasan guru</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead className="hidden md:table-cell">Tahun Ajaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal Penugasan</TableHead>
                  <TableHead className="hidden lg:table-cell">Catatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachingAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <span className="font-medium">{assignment.class.code}</span>
                      <span className="ml-2 text-muted-foreground">{assignment.class.name}</span>
                    </TableCell>
                    <TableCell>{assignment.subject.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{assignment.academic_year.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.is_active ? "default" : "secondary"}>
                        {assignment.is_active ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {new Date(assignment.assigned_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {assignment.notes ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {assignment.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowRevokeDialog(true);
                          }}
                        >
                          <Trash2 className="mr-1 size-4" />
                          Cabut
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Wali Kelas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="size-4" />
            Wali Kelas
          </CardTitle>
          <CardDescription>
            Penugasan wali kelas yang sedang aktif
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.homerooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <School className="mb-2 size-8 opacity-50" />
              <p className="text-sm">Tidak ada penugasan wali kelas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tahun Akademik</TableHead>
                  <TableHead className="hidden md:table-cell">Ditetapkan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacher.homerooms.map((hr) => (
                  <TableRow key={hr.homeroom_assignment_id}>
                    <TableCell>
                      <span className="font-medium">{hr.class_code}</span>
                      <span className="ml-2 text-muted-foreground">
                        {hr.class_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {hr.academic_year_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {hr.assigned_at}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tugas Aktif */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-4" />
            Tugas Aktif
          </CardTitle>
          <CardDescription>
            Daftar penugasan yang sedang aktif
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.duties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Shield className="mb-2 size-8 opacity-50" />
              <p className="text-sm">Tidak ada tugas aktif</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Tugas</TableHead>
                  <TableHead className="hidden md:table-cell">Ditetapkan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacher.duties.map((duty) => (
                  <TableRow key={duty.code}>
                    <TableCell>
                      <Badge variant="secondary">{duty.code}</Badge>
                    </TableCell>
                    <TableCell>{duty.duty_name}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {duty.assigned_at}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4 text-emerald-600" />
              Tambah Penugasan Guru
            </DialogTitle>
            <DialogDescription>
              Tetapkan kelas-mapel untuk guru {teacher.name} pada tahun ajaran login.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-13rem)] space-y-5 overflow-y-auto pr-1">
            <Alert>
              <AlertDescription>
                Tahun ajaran: <span className="font-medium">{selectedAcademicYearName}</span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="subject-select">1. Pilih Mata Pelajaran</Label>
              <Select
                value={formData.subject_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    subject_id: value,
                    class_subject_ids: [],
                  }))
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
              <Label>2. Pilih Kelas</Label>
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
                {selectableClassesBySubject.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Pilih mata pelajaran terlebih dahulu.
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
                          {item.class.code} - {item.class.name}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">3. Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan jika diperlukan"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-2 rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-700">Ringkasan Pilihan</p>
              <p>
                <span className="font-semibold">Guru:</span> {teacher.name}
              </p>
              <p>
                <span className="font-semibold">Mata Pelajaran:</span>{" "}
                {selectedSubject ? `${selectedSubject.code} - ${selectedSubject.name}` : "Belum dipilih"}
              </p>
              <p>
                <span className="font-semibold">Kelas:</span>{" "}
                {selectedClasses.length > 0
                  ? selectedClasses
                      .map((item) => `${item.class.code} - ${item.class.name}`)
                      .join(", ")
                  : "Belum dipilih"}
              </p>
              <p>
                <span className="font-semibold">Tahun Ajaran:</span> {selectedAcademicYearName}
              </p>
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
              onClick={handleCreateTeachingAssignment}
              disabled={
                isCreatingAssignment ||
                !selectedAcademicYearId ||
                !formData.subject_id ||
                formData.class_subject_ids.length === 0
              }
            >
              <CheckCircle2 className="mr-2 size-4" />
              {isCreatingAssignment
                ? "Menyimpan..."
                : `Simpan ${formData.class_subject_ids.length > 0 ? `${formData.class_subject_ids.length} Penugasan` : "Penugasan"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRevokeDialog}
        onOpenChange={(open) => {
          setShowRevokeDialog(open);
          if (!open) {
            setSelectedAssignment(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />
              Cabut Penugasan Guru
            </DialogTitle>
            <DialogDescription>
              Penugasan akan dinonaktifkan dan tidak dapat dipakai untuk jadwal baru.
            </DialogDescription>
          </DialogHeader>

          {selectedAssignment && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
              <p>
                <span className="font-semibold">Guru:</span> {teacher.name}
              </p>
              <p>
                <span className="font-semibold">Kelas:</span> {selectedAssignment.class.code} - {selectedAssignment.class.name}
              </p>
              <p>
                <span className="font-semibold">Mata Pelajaran:</span> {selectedAssignment.subject.name}
              </p>
              <p>
                <span className="font-semibold">Tahun Ajaran:</span> {selectedAssignment.academic_year.name}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRevokeDialog(false);
                setSelectedAssignment(null);
              }}
              disabled={isRevokingAssignment}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeTeachingAssignment}
              disabled={isRevokingAssignment || !selectedAssignment}
            >
              {isRevokingAssignment ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Mencabut...
                </>
              ) : (
                "Cabut Penugasan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
