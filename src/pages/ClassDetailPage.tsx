import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { classService } from "@/services/classService";
import { scheduleService } from "@/services/scheduleService";
import { subjectService } from "@/services/subjectService";
import { useNotification } from "@/hooks/use-notification";
import type {
  ClassDetail,
  ClassSubjectMapping,
  SubjectListItem,
} from "@/types";
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
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
  School,
  Hash,
  Layers,
  Plus,
  CheckCircle2,
  Calendar,
  UserCheck,
  GraduationCap,
  Users,
  BookOpen,
} from "lucide-react";

export default function ClassDetailPage() {
  const { notify } = useNotification();
  const { id } = useParams<{ id: string }>();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectMapping[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const selectedAcademicYearId = localStorage.getItem("selectedAcademicYearId") || "";
  const selectedAcademicYearName =
    localStorage.getItem("selectedAcademicYearName") || "Belum dipilih";
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    subject_ids: [] as string[],
  });

  const classId = Number(id);

  const loadClassSubjects = useCallback(
    async () => {
      if (!Number.isFinite(classId)) return;

      if (!selectedAcademicYearId) {
        setClassSubjects([]);
        return;
      }

      try {
        setIsSubjectsLoading(true);
        const response = await scheduleService.listClassSubjects({
          class_id: classId,
          academic_year_id: Number(selectedAcademicYearId),
          include_inactive: true,
          limit: 100,
        });
        setClassSubjects(response.data);
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat mata pelajaran kelas";
        toast.error(message);
      } finally {
        setIsSubjectsLoading(false);
      }
    },
    [classId, selectedAcademicYearId]
  );

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await classService.getById(parseInt(id));
        setClassData(res.data);
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat data kelas";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const subjectRes = await subjectService.list({ limit: 100 });

        setSubjects(subjectRes.data.filter((subject) => subject.is_active));
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat referensi mapel kelas";
        toast.error(message);
      }
    }

    loadReferenceData();
  }, []);

  useEffect(() => {
    if (!selectedAcademicYearId || !Number.isFinite(classId)) return;
    loadClassSubjects();
  }, [selectedAcademicYearId, classId, loadClassSubjects]);

  const activeHomerooms = classData?.homeroom_assignments.filter(
    (h) => h.is_active
  ) ?? [];

  const selectedSubjects = useMemo(
    () =>
      subjects.filter((subject) =>
        subjectForm.subject_ids.includes(subject.id.toString())
      ),
    [subjects, subjectForm.subject_ids]
  );

  const handleCreateClassSubject = async () => {
    if (!classData) return;

    if (!selectedAcademicYearId) {
      notify("error", "Pilih tahun akademik pada card mata pelajaran kelas");
      return;
    }

    if (subjectForm.subject_ids.length === 0) {
      notify("error", "Pilih minimal satu mata pelajaran");
      return;
    }

    try {
      const existingMappings = await scheduleService.listClassSubjects({
        class_id: classData.id,
        academic_year_id: Number(selectedAcademicYearId),
        include_inactive: false,
        limit: 100,
      });

      const existingSubjectIds = new Set(
        existingMappings.data
          .filter((mapping) => mapping.is_active)
          .map((mapping) => mapping.subject.id.toString())
      );

      const toCreateSubjectIds = subjectForm.subject_ids.filter(
        (subjectId) => !existingSubjectIds.has(subjectId)
      );

      if (toCreateSubjectIds.length === 0) {
        notify(
          "warning",
          "Semua mapel yang dipilih sudah aktif pada kelas ini"
        );
        return;
      }

      let createdCount = 0;
      let conflictCount = 0;
      let failedCount = 0;
      let firstErrorMessage = "";

      for (const subjectId of toCreateSubjectIds) {
        try {
          await scheduleService.createClassSubject({
            class_id: classData.id,
            subject_id: Number(subjectId),
            academic_year_id: Number(selectedAcademicYearId),
          });
          createdCount += 1;
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Gagal menambahkan mapel ke kelas";

          if (message.includes("already active")) {
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
        notify("success", `${createdCount} mapel berhasil ditambahkan ke kelas`);
      }

      const preSkippedCount =
        subjectForm.subject_ids.length - toCreateSubjectIds.length;
      const skippedCount = preSkippedCount + conflictCount;
      if (skippedCount > 0) {
        notify(
          "warning",
          `${skippedCount} mapel dilewati karena sudah aktif pada kelas ini`
        );
      }

      if (failedCount > 0) {
        notify(
          "error",
          firstErrorMessage || `${failedCount} mapel gagal ditambahkan`
        );
      }

      if (createdCount === 0) {
        return;
      }

      setShowAddSubjectDialog(false);
      setSubjectForm({ subject_ids: [] });
      await loadClassSubjects();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambahkan mapel kelas";
      notify("error", message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/kelas">
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <School className="mb-2 size-8 opacity-50" />
            <p className="text-sm">Kelas tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/kelas">
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSubjectForm({ subject_ids: [] });
            setShowAddSubjectDialog(true);
          }}
        >
            <BookOpen className="mr-2 size-4" />
            Manajemen Mapel Kelas
        </Button>
      </div>

      {/* Class Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <School className="size-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{classData.name}</CardTitle>
              <CardDescription>Detail informasi kelas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Hash className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Kode</p>
                <p className="font-mono text-sm font-medium">
                  {classData.code}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Layers className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tingkat</p>
                <p className="text-sm font-medium">
                  {classData.level ?? "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Users className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Jumlah Siswa</p>
                <p className="text-sm font-medium">{classData.students.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <UserCheck className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Wali Kelas Aktif
                </p>
                <p className="text-sm font-medium">
                  {activeHomerooms.length > 0
                    ? activeHomerooms[0].teacher.name
                    : "Belum ditentukan"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Subjects */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5" />
                Mata Pelajaran Kelas
              </CardTitle>
              <CardDescription>
                Daftar mapel pada kelas ini berdasarkan tahun ajaran login
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit">
              Tahun Ajaran: {selectedAcademicYearName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedAcademicYearId ? (
            <Alert>
              <AlertDescription>
                Tahun ajaran login belum ditemukan. Silakan logout lalu login ulang dan pilih tahun ajaran.
              </AlertDescription>
            </Alert>
          ) : isSubjectsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : classSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <BookOpen className="mb-2 size-6 opacity-50" />
              <p className="text-sm">Belum ada mapel di kelas ini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Kode Mapel</TableHead>
                  <TableHead>Nama Mapel</TableHead>
                  <TableHead className="hidden md:table-cell">Tahun Akademik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Tanggal Penugasan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classSubjects.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                      {mapping.subject.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {mapping.subject.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">
                        {mapping.academic_year.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={mapping.is_active ? "default" : "secondary"}
                      >
                        {mapping.is_active ? "Aktif" : "Tidak Aktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {new Date(mapping.assigned_at).toLocaleDateString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Active Homeroom */}
      {activeHomerooms && activeHomerooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5" />
              Wali Kelas Aktif
            </CardTitle>
            <CardDescription>
              Guru wali kelas yang saat ini bertugas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">NIP</TableHead>
                  <TableHead>Nama Guru</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead className="hidden md:table-cell">Ditugaskan</TableHead>
                  <TableHead className="hidden lg:table-cell">Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeHomerooms.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                      {h.teacher.nip ?? "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {h.teacher.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {h.academic_year.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {h.assigned_at}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {h.notes ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Homeroom History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Riwayat Wali Kelas
          </CardTitle>
          <CardDescription>
            Semua riwayat penugasan wali kelas untuk kelas ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classData.homeroom_assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <UserCheck className="mb-2 size-6 opacity-50" />
              <p className="text-sm">Belum ada riwayat wali kelas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">NIP</TableHead>
                  <TableHead>Nama Guru</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead className="hidden md:table-cell">Ditugaskan</TableHead>
                  <TableHead className="hidden lg:table-cell">Berakhir</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.homeroom_assignments.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                      {h.teacher.nip ?? "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {h.teacher.name}
                    </TableCell>
                    <TableCell className="text-sm">
                      {h.academic_year.name}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {h.assigned_at}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {h.ended_at ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={h.is_active ? "default" : "secondary"}
                      >
                        {h.is_active ? "Aktif" : "Selesai"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Daftar Siswa
          </CardTitle>
          <CardDescription>
            Semua riwayat siswa yang pernah terdaftar di kelas ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classData.students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <GraduationCap className="mb-2 size-6 opacity-50" />
              <p className="text-sm">Belum ada siswa di kelas ini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">NIS</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden md:table-cell">Gender</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Tahun Ajaran</TableHead>
                  <TableHead>Status Enroll</TableHead>
                  <TableHead>Status Siswa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.students.map((s) => (
                  <TableRow key={s.enrollment.id}>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                      {s.nis}
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{s.gender === "M" ? "L" : s.gender === "F" ? "P" : "-"}</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{s.email ?? "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{s.enrollment.academic_year.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.enrollment.is_active ? "default" : "secondary"}>
                        {s.enrollment.is_active ? "Aktif" : "Selesai"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "default" : "secondary"}>
                        {s.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showAddSubjectDialog}
        onOpenChange={(open) => {
          setShowAddSubjectDialog(open);
          if (!open) {
            setSubjectForm({ subject_ids: [] });
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4 text-emerald-600" />
              Tambah Mapel Kelas
            </DialogTitle>
            <DialogDescription>
              Tambahkan mapel untuk kelas {classData.code} - {classData.name} pada tahun akademik aktif.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-13rem)] space-y-5 overflow-y-auto pr-1">
            <Alert>
              <AlertDescription>
                Tahun akademik mengikuti pilihan saat login:{" "}
                <span className="font-medium">
                  {selectedAcademicYearName}
                </span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>1. Pilih Mata Pelajaran (Bisa lebih dari 1)</Label>
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
                {subjects.map((subject) => {
                  const value = subject.id.toString();
                  const checked = subjectForm.subject_ids.includes(value);

                  return (
                    <label
                      key={subject.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={!selectedAcademicYearId}
                        onCheckedChange={(isChecked) => {
                          setSubjectForm((prev) => ({
                            ...prev,
                            subject_ids: isChecked
                              ? [...prev.subject_ids, value]
                              : prev.subject_ids.filter((id) => id !== value),
                          }));
                        }}
                      />
                      <span className="text-sm">
                        {subject.code} - {subject.name}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Pilih tahun akademik pada card terlebih dahulu, lalu centang satu atau beberapa mapel.
              </p>
            </div>

            <Separator />

            <div className="space-y-2 rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-700">Ringkasan Pilihan</p>
              <p>
                <span className="font-semibold">Kelas:</span> {classData.code} - {classData.name}
              </p>
              <p>
                <span className="font-semibold">Mapel:</span>{" "}
                {selectedSubjects.length > 0
                  ? selectedSubjects
                      .map((subject) => `${subject.code} - ${subject.name}`)
                      .join(", ")
                  : "Belum dipilih"}
              </p>
              <p>
                <span className="font-semibold">Tahun Akademik:</span>{" "}
                {selectedAcademicYearName}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddSubjectDialog(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreateClassSubject}
              disabled={
                subjectForm.subject_ids.length === 0 || !selectedAcademicYearId
              }
            >
              <CheckCircle2 className="mr-2 size-4" />
              Simpan {subjectForm.subject_ids.length > 0 ? `${subjectForm.subject_ids.length} Relasi` : "Relasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
