import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Plus,
} from "lucide-react";
import { attendanceService } from "@/services/attendanceService";
import { classService } from "@/services/classService";
import { subjectService } from "@/services/subjectService";
import { teacherService } from "@/services/teacherService";
import { academicYearService } from "@/services/academicYearService";
import { scheduleService } from "@/services/scheduleService";
import type {
  AttendanceMeetingListItem,
  AttendanceStatus,
  TeachingAssignment,
} from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const ATTENDANCE_STATUS_OPTIONS: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "HADIR", label: "Hadir" },
  { value: "SAKIT", label: "Sakit" },
  { value: "IZIN", label: "Izin" },
  { value: "ALPA", label: "Alpa" },
];

type AttendanceDraft = {
  status: AttendanceStatus;
  notes: string;
};

export default function AttendanceMeetingPage() {
  const [page] = useState(1);
  const limit = 20;

  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [meetingDateFilter, setMeetingDateFilter] = useState("");

  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, AttendanceDraft>>({});
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createAssignmentId, setCreateAssignmentId] = useState("all");
  const [createMeetingNo, setCreateMeetingNo] = useState("");
  const [createMeetingDate, setCreateMeetingDate] = useState("");
  const [createTopic, setCreateTopic] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  const { data: classesData } = useQuery({
    queryKey: ["attendance-classes", { limit: 100 }],
    queryFn: () => classService.list({ limit: 100 }),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ["attendance-subjects", { limit: 100 }],
    queryFn: () => subjectService.list({ limit: 100 }),
  });

  const { data: teachersData } = useQuery({
    queryKey: ["attendance-teachers", { limit: 100 }],
    queryFn: () => teacherService.list({ limit: 100 }),
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ["attendance-academic-years", { limit: 100 }],
    queryFn: () => academicYearService.list({ limit: 100 }),
  });

  const { data: assignmentsData } = useQuery({
    queryKey: ["attendance-teaching-assignments", { limit: 100, include_inactive: false }],
    queryFn: () =>
      scheduleService.listTeachingAssignments({
        limit: 100,
        include_inactive: false,
      }),
  });

  const {
    data: meetingsData,
    isLoading: isLoadingMeetings,
    refetch: refetchMeetings,
  } = useQuery({
    queryKey: [
      "attendance-meetings",
      {
        page,
        limit,
        classFilter,
        subjectFilter,
        teacherFilter,
        academicYearFilter,
        meetingDateFilter,
      },
    ],
    queryFn: () =>
      attendanceService.listMeetings({
        page,
        limit,
        class_id: classFilter === "all" ? undefined : Number(classFilter),
        subject_id: subjectFilter === "all" ? undefined : Number(subjectFilter),
        teacher_id: teacherFilter === "all" ? undefined : Number(teacherFilter),
        academic_year_id: academicYearFilter === "all" ? undefined : Number(academicYearFilter),
        meeting_date: meetingDateFilter || undefined,
      }),
  });

  const {
    data: meetingDetailData,
    isLoading: isLoadingMeetingDetail,
    refetch: refetchMeetingDetail,
  } = useQuery({
    queryKey: ["attendance-meeting-detail", selectedMeetingId],
    queryFn: () => attendanceService.getMeetingById(Number(selectedMeetingId)),
    enabled: !!selectedMeetingId,
  });

  const meetingList = meetingsData?.data || [];

  useEffect(() => {
    if (!meetingList.length) {
      setSelectedMeetingId(null);
      return;
    }

    if (!selectedMeetingId || !meetingList.some((m) => m.id === selectedMeetingId)) {
      setSelectedMeetingId(meetingList[0].id);
    }
  }, [meetingList, selectedMeetingId]);

  useEffect(() => {
    const detail = meetingDetailData?.data;
    if (!detail) {
      setDrafts({});
      return;
    }

    const nextDrafts: Record<number, AttendanceDraft> = {};
    for (const row of detail.attendance) {
      nextDrafts[row.student.id] = {
        status: row.status,
        notes: row.notes || "",
      };
    }
    setDrafts(nextDrafts);
  }, [meetingDetailData?.data]);

  const selectedMeeting = useMemo(
    () => meetingList.find((m) => m.id === selectedMeetingId) || null,
    [meetingList, selectedMeetingId]
  );

  const activeAssignments = useMemo(
    () => (assignmentsData?.data || []).filter((a) => a.is_active),
    [assignmentsData?.data]
  );

  function resetCreateForm() {
    setCreateAssignmentId("all");
    setCreateMeetingNo("");
    setCreateMeetingDate("");
    setCreateTopic("");
    setCreateNotes("");
  }

  function handleChangeDraftStatus(studentId: number, status: AttendanceStatus) {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { notes: "" }),
        status,
      },
    }));
  }

  function handleChangeDraftNotes(studentId: number, notes: string) {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: "HADIR" as AttendanceStatus }),
        notes,
      },
    }));
  }

  async function handleCreateMeeting(e: React.FormEvent) {
    e.preventDefault();

    if (createAssignmentId === "all") {
      toast.error("Pilih penugasan mengajar terlebih dahulu");
      return;
    }

    if (!createMeetingDate) {
      toast.error("Tanggal pertemuan wajib diisi");
      return;
    }

    setIsCreatingMeeting(true);
    try {
      const res = await attendanceService.createMeeting({
        teaching_assignment_id: Number(createAssignmentId),
        meeting_no: createMeetingNo ? Number(createMeetingNo) : undefined,
        meeting_date: createMeetingDate,
        topic: createTopic || undefined,
        notes: createNotes || undefined,
      });

      toast.success("Pertemuan berhasil dibuat");
      setCreateOpen(false);
      resetCreateForm();
      await refetchMeetings();
      setSelectedMeetingId(res.data.id);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal membuat pertemuan";
      toast.error(message);
    } finally {
      setIsCreatingMeeting(false);
    }
  }

  async function handleSaveAttendance() {
    if (!selectedMeetingId) return;

    const detail = meetingDetailData?.data;
    if (!detail) return;

    const records = detail.attendance.map((row) => ({
      student_id: row.student.id,
      status: (drafts[row.student.id]?.status || row.status) as AttendanceStatus,
      notes: drafts[row.student.id]?.notes || undefined,
    }));

    if (!records.length) {
      toast.error("Tidak ada data absensi untuk disimpan");
      return;
    }

    setIsSavingAttendance(true);
    try {
      await attendanceService.upsertMeetingAttendance(selectedMeetingId, { records });
      toast.success("Absensi pertemuan berhasil disimpan");
      await refetchMeetingDetail();
      await refetchMeetings();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menyimpan absensi";
      toast.error(message);
    } finally {
      setIsSavingAttendance(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Absensi Pertemuan</h1>
          <p className="text-muted-foreground">
            Kelola pertemuan mata pelajaran dan absensi siswa per pertemuan.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Buat Pertemuan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            Filter Pertemuan
          </CardTitle>
          <CardDescription>Pilih filter untuk mempersempit daftar pertemuan.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Kelas</Label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                {classesData?.data?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.code} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mata Pelajaran</Label>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua mapel</SelectItem>
                {subjectsData?.data?.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.code} - {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Guru</Label>
            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua guru</SelectItem>
                {teachersData?.data?.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tahun Akademik</Label>
            <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua tahun</SelectItem>
                {academicYearsData?.data?.map((y) => (
                  <SelectItem key={y.id} value={String(y.id)}>{y.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tanggal Pertemuan</Label>
            <Input type="date" value={meetingDateFilter} onChange={(e) => setMeetingDateFilter(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Daftar Pertemuan</CardTitle>
            <CardDescription>{meetingsData?.meta ? `Total ${meetingsData.meta.total} pertemuan` : "Memuat..."}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMeetings ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : meetingList.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Belum ada pertemuan yang sesuai filter.
              </div>
            ) : (
              <div className="space-y-2">
                {meetingList.map((m: AttendanceMeetingListItem) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMeetingId(m.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${selectedMeetingId === m.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">Pertemuan #{m.meeting_no}</p>
                      <Badge variant="outline">{m.meeting_date}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {m.teaching_assignment.class.code} - {m.teaching_assignment.subject.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.teaching_assignment.teacher.name} • {m.teaching_assignment.academic_year.code}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Sudah tercatat: {m.attendance_count} siswa
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="size-5" />
                Input Absensi
              </CardTitle>
              <CardDescription>
                {selectedMeeting
                  ? `${selectedMeeting.teaching_assignment.class.code} - ${selectedMeeting.teaching_assignment.subject.name}`
                  : "Pilih pertemuan untuk mulai input absensi"}
              </CardDescription>
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={handleSaveAttendance}
              disabled={!selectedMeetingId || isSavingAttendance || !meetingDetailData?.data?.attendance?.length}
            >
              {isSavingAttendance && <Loader2 className="mr-2 size-4 animate-spin" />}
              <CheckCircle2 className="mr-2 size-4" />
              Simpan Absensi
            </Button>
          </CardHeader>
          <CardContent>
            {!selectedMeetingId ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Pilih salah satu pertemuan pada daftar kiri.
              </div>
            ) : isLoadingMeetingDetail ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : !meetingDetailData?.data?.attendance?.length ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Belum ada siswa aktif pada kelas pertemuan ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="w-36">Status</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetingDetailData.data.attendance.map((row) => (
                      <TableRow key={row.student.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.student.nis}</TableCell>
                        <TableCell className="font-medium">{row.student.name}</TableCell>
                        <TableCell>
                          <Select
                            value={drafts[row.student.id]?.status || row.status}
                            onValueChange={(value) => handleChangeDraftStatus(row.student.id, value as AttendanceStatus)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Opsional"
                            value={drafts[row.student.id]?.notes || ""}
                            onChange={(e) => handleChangeDraftNotes(row.student.id, e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Buat Pertemuan Baru</DialogTitle>
            <DialogDescription>
              Pilih penugasan mengajar, tentukan tanggal, lalu simpan pertemuan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMeeting} className="space-y-4">
            <div className="space-y-2">
              <Label>Penugasan Mengajar</Label>
              <Select value={createAssignmentId} onValueChange={setCreateAssignmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih penugasan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Pilih penugasan</SelectItem>
                  {activeAssignments.map((a: TeachingAssignment) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.class.code} - {a.subject.name} ({a.teacher.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tanggal Pertemuan</Label>
                <Input
                  type="date"
                  value={createMeetingDate}
                  onChange={(e) => setCreateMeetingDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>No Pertemuan (Opsional)</Label>
                <Input
                  type="number"
                  min={1}
                  value={createMeetingNo}
                  onChange={(e) => setCreateMeetingNo(e.target.value)}
                  placeholder="Auto jika kosong"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topik</Label>
              <Input
                value={createTopic}
                onChange={(e) => setCreateTopic(e.target.value)}
                placeholder="Contoh: Persamaan Linear"
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Opsional"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isCreatingMeeting}>
                {isCreatingMeeting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Simpan Pertemuan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
