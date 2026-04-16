import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { classService } from "@/services/classService";
import { subjectService } from "@/services/subjectService";
import { assessmentService } from "@/services/assessmentService";
import { scoreService } from "@/services/scoreService";
import { teacherService } from "@/services/teacherService";
import { academicYearService } from "@/services/academicYearService";
import { useAuthStore } from "@/stores/authStore";
import type {
  AcademicYear,
  AssessmentItem,
  ClassListItem,
  ClassStudentItem,
  ScoreItem,
  SubjectListItem,
  TeacherListItem,
} from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { Loader2, Save, ClipboardList, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";

type RowDraft = {
  scoreId?: number;
  nilai: string;
};

export default function ScoreManagementPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperadmin = !!user?.duties?.some((d) => d === "superadmin");
  const isAdmin = !!user?.duties?.some((d) => d === "admin" || d === "superadmin");

  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState<AcademicYear | null>(null);

  const [selectedClassId, setSelectedClassId] = useState("-");
  const [selectedSubjectId, setSelectedSubjectId] = useState("-");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("-");

  const [students, setStudents] = useState<ClassStudentItem[]>([]);
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});

  const [isLoadingRefs, setIsLoadingRefs] = useState(true);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);

  const [createAssessmentOpen, setCreateAssessmentOpen] = useState(false);
  const [editAssessmentOpen, setEditAssessmentOpen] = useState(false);
  const [deleteAssessmentOpen, setDeleteAssessmentOpen] = useState(false);
  const [selectedAssessmentEdit, setSelectedAssessmentEdit] = useState<AssessmentItem | null>(null);
  const [selectedAssessmentDelete, setSelectedAssessmentDelete] = useState<AssessmentItem | null>(null);
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);

  const [assessmentName, setAssessmentName] = useState("");
  const [assessmentBobot, setAssessmentBobot] = useState("");
  const [assessmentDescription, setAssessmentDescription] = useState("");
  const [assessmentTeacherId, setAssessmentTeacherId] = useState("-");
  const [isAssessmentSectionCollapsed, setIsAssessmentSectionCollapsed] = useState(true);

  const canLoadRows =
    selectedClassId !== "-" &&
    selectedSubjectId !== "-" &&
    selectedAssessmentId !== "-";

  const selectedAssessment = useMemo(
    () => assessments.find((a) => a.id === Number(selectedAssessmentId)) || null,
    [assessments, selectedAssessmentId]
  );

  const loadReferences = useCallback(async () => {
    setIsLoadingRefs(true);
    try {
      const [classRes, subjectRes, assessmentRes, academicYearRes] = await Promise.all([
        classService.list({
          limit: 100,
          assigned_only: !isSuperadmin,
        }),
        subjectService.list({ limit: 100 }),
        assessmentService.list({ limit: 100, is_active: true }),
        academicYearService.list({ limit: 100 }),
      ]);

      if (isAdmin) {
        const teacherRes = await teacherService.list({ limit: 100 });
        setTeachers(teacherRes.data);
      }

      setClasses(classRes.data);
      setSubjects(subjectRes.data);
      setAssessments(assessmentRes.data);
      const selectedAcademicYearId = Number(localStorage.getItem("selectedAcademicYearId") || 0);
      const selectedAcademicYear = academicYearRes.data.find((ay) => ay.id === selectedAcademicYearId) || null;
      const activeYear = academicYearRes.data.find((ay) => ay.is_active) || null;
      setActiveAcademicYear(selectedAcademicYear || activeYear);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat referensi nilai";
      toast.error(message);
    } finally {
      setIsLoadingRefs(false);
    }
  }, [isAdmin, isSuperadmin]);

  const loadRows = useCallback(async () => {
    if (!canLoadRows) {
      setStudents([]);
      setDrafts({});
      return;
    }

    setIsLoadingRows(true);
    try {
      const classId = Number(selectedClassId);
      const subjectId = Number(selectedSubjectId);
      const assessmentId = Number(selectedAssessmentId);

      const [classDetailRes, scoreRes] = await Promise.all([
        classService.getById(classId),
        scoreService.list({
          limit: 100,
          subject_id: subjectId,
          assessment_id: assessmentId,
          academic_year_id: activeAcademicYear?.id,
        }),
      ]);

      const activeStudents = classDetailRes.data.students.filter((s) => s.enrollment.is_active);
      const studentIdSet = new Set(activeStudents.map((s) => s.id));
      const filteredScores = scoreRes.data.filter((s: ScoreItem) => studentIdSet.has(s.student.id));

      const nextDrafts: Record<number, RowDraft> = {};
      for (const student of activeStudents) {
        const score = filteredScores.find((r) => r.student.id === student.id);
        nextDrafts[student.id] = {
          scoreId: score?.id,
          nilai: score ? String(score.nilai) : "",
        };
      }

      setStudents(activeStudents);
      setDrafts(nextDrafts);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data siswa/nilai";
      toast.error(message);
    } finally {
      setIsLoadingRows(false);
    }
  }, [canLoadRows, selectedAssessmentId, selectedClassId, selectedSubjectId, activeAcademicYear?.id]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  function resetAssessmentForm() {
    setAssessmentName("");
    setAssessmentBobot("");
    setAssessmentDescription("");
    setAssessmentTeacherId("-");
  }

  async function handleCreateAssessment(e: React.FormEvent) {
    e.preventDefault();
    const bobot = Number(assessmentBobot);
    if (!assessmentName.trim()) {
      toast.error("Nama penilaian wajib diisi");
      return;
    }
    if (Number.isNaN(bobot) || bobot < 0 || bobot > 100) {
      toast.error("Bobot harus di antara 0 sampai 100");
      return;
    }
    if (isAdmin && assessmentTeacherId === "-") {
      toast.error("Pilih guru pemilik assessment");
      return;
    }

    setIsSavingAssessment(true);
    try {
      await assessmentService.create({
        nama_penilaian: assessmentName.trim(),
        bobot,
        description: assessmentDescription.trim() || undefined,
        teacher_id: isAdmin ? Number(assessmentTeacherId) : undefined,
      });
      toast.success("Assessment berhasil ditambahkan");
      setCreateAssessmentOpen(false);
      resetAssessmentForm();
      loadReferences();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambah assessment";
      toast.error(message);
    } finally {
      setIsSavingAssessment(false);
    }
  }

  function openEditAssessment(item: AssessmentItem) {
    setSelectedAssessmentEdit(item);
    setAssessmentName(item.nama_penilaian);
    setAssessmentBobot(String(item.bobot));
    setAssessmentDescription(item.description || "");
    setEditAssessmentOpen(true);
  }

  async function handleEditAssessment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAssessmentEdit) return;
    const bobot = Number(assessmentBobot);
    if (!assessmentName.trim()) {
      toast.error("Nama penilaian wajib diisi");
      return;
    }
    if (Number.isNaN(bobot) || bobot < 0 || bobot > 100) {
      toast.error("Bobot harus di antara 0 sampai 100");
      return;
    }

    setIsSavingAssessment(true);
    try {
      await assessmentService.update(selectedAssessmentEdit.id, {
        nama_penilaian: assessmentName.trim(),
        bobot,
        description: assessmentDescription.trim() || null,
      });
      toast.success("Assessment berhasil diperbarui");
      setEditAssessmentOpen(false);
      setSelectedAssessmentEdit(null);
      resetAssessmentForm();
      loadReferences();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui assessment";
      toast.error(message);
    } finally {
      setIsSavingAssessment(false);
    }
  }

  async function handleDeleteAssessment() {
    if (!selectedAssessmentDelete) return;
    setIsSavingAssessment(true);
    try {
      await assessmentService.delete(selectedAssessmentDelete.id);
      toast.success("Assessment berhasil dihapus");
      if (selectedAssessmentId === String(selectedAssessmentDelete.id)) {
        setSelectedAssessmentId("-");
      }
      setDeleteAssessmentOpen(false);
      setSelectedAssessmentDelete(null);
      loadReferences();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menghapus assessment";
      toast.error(message);
    } finally {
      setIsSavingAssessment(false);
    }
  }

  function handleChangeNilai(studentId: number, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        nilai: value,
      },
    }));
  }

  async function saveOne(studentId: number) {
    const draft = drafts[studentId];
    if (!draft) return;
    if (!activeAcademicYear) {
      toast.error("Tahun akademik aktif tidak ditemukan");
      return;
    }

    const nilai = Number(draft.nilai);
    if (!draft.nilai || Number.isNaN(nilai) || nilai < 0 || nilai > 100) {
      toast.error("Nilai harus angka 0-100");
      return;
    }

    setSavingStudentId(studentId);
    try {
      if (draft.scoreId) {
        await scoreService.update(draft.scoreId, { nilai });
      } else {
        const res = await scoreService.create({
          student_id: studentId,
          subject_id: Number(selectedSubjectId),
          assessment_id: Number(selectedAssessmentId),
          academic_year_id: activeAcademicYear.id,
          nilai,
        });

        setDrafts((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            scoreId: res.data.id,
          },
        }));
      }
      toast.success("Nilai berhasil disimpan");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menyimpan nilai";
      toast.error(message);
    } finally {
      setSavingStudentId(null);
    }
  }

  async function saveAll() {
    if (!students.length) return;
    if (!activeAcademicYear) {
      toast.error("Tahun akademik aktif tidak ditemukan");
      return;
    }

    setIsSavingAll(true);
    let successCount = 0;
    let failCount = 0;

    for (const s of students) {
      const draft = drafts[s.id];
      if (!draft?.nilai) continue;

      const nilai = Number(draft.nilai);
      if (Number.isNaN(nilai) || nilai < 0 || nilai > 100) {
        failCount += 1;
        continue;
      }

      try {
        if (draft.scoreId) {
          await scoreService.update(draft.scoreId, { nilai });
        } else {
          const res = await scoreService.create({
            student_id: s.id,
            subject_id: Number(selectedSubjectId),
            assessment_id: Number(selectedAssessmentId),
            academic_year_id: activeAcademicYear.id,
            nilai,
          });

          setDrafts((prev) => ({
            ...prev,
            [s.id]: {
              ...prev[s.id],
              scoreId: res.data.id,
            },
          }));
        }
        successCount += 1;
      } catch {
        failCount += 1;
      }
    }

    if (successCount) {
      toast.success(`${successCount} nilai berhasil disimpan`);
    }
    if (failCount) {
      toast.error(`${failCount} nilai gagal disimpan`);
    }

    setIsSavingAll(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Input Nilai Sumatif</h1>
        <p className="text-muted-foreground">
          Input dan update nilai berdasarkan skema penilaian milik guru
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Manajemen Assessment</CardTitle>
            <CardDescription>
              Kelola tipe penilaian dan bobot per guru
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsAssessmentSectionCollapsed((prev) => !prev)}
            >
              {isAssessmentSectionCollapsed ? (
                <>
                  <ChevronDown className="mr-2 size-4" />
                  Tampilkan
                </>
              ) : (
                <>
                  <ChevronUp className="mr-2 size-4" />
                  Sembunyikan
                </>
              )}
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setCreateAssessmentOpen(true)}>
              <Plus className="mr-2 size-4" />
              Tambah Assessment
            </Button>
          </div>
        </CardHeader>
        {!isAssessmentSectionCollapsed && (
          <CardContent>
            {isLoadingRefs ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : assessments.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Belum ada assessment.
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Penilaian</TableHead>
                    <TableHead>Bobot</TableHead>
                    {isAdmin && <TableHead>Guru</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nama_penilaian}</TableCell>
                      <TableCell>{a.bobot}%</TableCell>
                      {isAdmin && <TableCell>{a.teacher ? a.teacher.name : "-"}</TableCell>}
                      <TableCell>
                        <Badge variant={a.is_active ? "default" : "secondary"}>
                          {a.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditAssessment(a)}>
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                          onClick={() => {
                            setSelectedAssessmentDelete(a);
                            setDeleteAssessmentOpen(true);
                          }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filter Data</CardTitle>
          <CardDescription>Pilih kelas, mata pelajaran, dan jenis penilaian</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Kelas</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Pilih kelas</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Mata Pelajaran</Label>
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih mata pelajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Pilih mata pelajaran</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.code} - {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Penilaian</Label>
            <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih penilaian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Pilih penilaian</SelectItem>
                {assessments.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.nama_penilaian} ({a.bobot}%) {isAdmin && a.teacher ? `- ${a.teacher.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-5" />
              Nilai Siswa
            </CardTitle>
            <CardDescription>
              {selectedAssessment
                ? `Bobot penilaian: ${selectedAssessment.bobot}%`
                : "Pilih filter untuk mulai input nilai"}
            </CardDescription>
          </div>
          <Button className="w-full sm:w-auto" onClick={saveAll} disabled={!students.length || isSavingAll || !canLoadRows}>
            {isSavingAll && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Save className="mr-2 size-4" />
            Simpan Semua
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingRefs || isLoadingRows ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : !canLoadRows ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Pilih kelas, mata pelajaran, dan penilaian terlebih dahulu.
            </div>
          ) : students.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Tidak ada siswa aktif pada kelas ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">NIS</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-40">Nilai</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden w-32 md:table-cell" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const draft = drafts[s.id];
                  const isSaved = !!draft?.scoreId;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{s.nis}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={draft?.nilai ?? ""}
                          onChange={(e) => handleChangeNilai(s.id, e.target.value)}
                          placeholder="0-100"
                        />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={isSaved ? "default" : "secondary"}>
                          {isSaved ? "Tersimpan" : "Belum"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveOne(s.id)}
                          disabled={savingStudentId === s.id}
                        >
                          {savingStudentId === s.id && <Loader2 className="mr-2 size-3 animate-spin" />}
                          Simpan
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createAssessmentOpen}
        onOpenChange={(open) => {
          setCreateAssessmentOpen(open);
          if (!open) resetAssessmentForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Assessment</DialogTitle>
            <DialogDescription>Tambah tipe penilaian dan bobot milik guru.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAssessment} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Penilaian</Label>
              <Input value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} placeholder="Contoh: Sumatif Akhir Bab" />
            </div>
            <div className="space-y-2">
              <Label>Bobot (%)</Label>
              <Input type="number" min={0} max={100} step="0.01" value={assessmentBobot} onChange={(e) => setAssessmentBobot(e.target.value)} placeholder="0 - 100" />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label>Guru Pemilik</Label>
                <Select value={assessmentTeacherId} onValueChange={setAssessmentTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih guru" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Pilih guru</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name} ({t.nip})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input value={assessmentDescription} onChange={(e) => setAssessmentDescription(e.target.value)} placeholder="Opsional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateAssessmentOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSavingAssessment}>
                {isSavingAssessment && <Loader2 className="mr-2 size-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editAssessmentOpen}
        onOpenChange={(open) => {
          setEditAssessmentOpen(open);
          if (!open) {
            setSelectedAssessmentEdit(null);
            resetAssessmentForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assessment</DialogTitle>
            <DialogDescription>Perbarui nama penilaian dan bobot.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAssessment} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Penilaian</Label>
              <Input value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bobot (%)</Label>
              <Input type="number" min={0} max={100} step="0.01" value={assessmentBobot} onChange={(e) => setAssessmentBobot(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input value={assessmentDescription} onChange={(e) => setAssessmentDescription(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditAssessmentOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSavingAssessment}>
                {isSavingAssessment && <Loader2 className="mr-2 size-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteAssessmentOpen} onOpenChange={setDeleteAssessmentOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Assessment {selectedAssessmentDelete?.nama_penilaian} akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAssessment} disabled={isSavingAssessment}>
              {isSavingAssessment && <Loader2 className="mr-2 size-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
