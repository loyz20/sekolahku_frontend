import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { classService } from "@/services/classService";
import { scheduleService } from "@/services/scheduleService";
import { subjectService } from "@/services/subjectService";
import { teacherService } from "@/services/teacherService";
import { dutyService } from "@/services/dutyService";
import { userService } from "@/services/userService";
import { studentService } from "@/services/studentService";
import { useNotification } from "@/hooks/use-notification";
import type {
  ClassDetail,
  ClassSubjectMapping,
  StudentListItem,
  SubjectListItem,
  TeacherListItem,
  TeachingAssignment,
  UserListItem,
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
  Check,
  ChevronsUpDown,
  CheckCircle2,
  Calendar,
  UserCheck,
  GraduationCap,
  Users,
  BookOpen,
  Trash2,
  Undo2,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

function CollapsibleSection({
  title,
  description,
  icon: Icon,
  actions,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="space-y-0 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Icon className="size-5" />
                {title}
              </CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="icon-sm" type="button" aria-label={open ? "Sembunyikan section" : "Tampilkan section"}>
                  {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function ClassDetailPage() {
  const { notify } = useNotification();
  const { id } = useParams<{ id: string }>();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectMapping[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [subjects, setSubjects] = useState<SubjectListItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [updatingClassSubjectId, setUpdatingClassSubjectId] = useState<number | null>(null);
  const [openTeacherPickerId, setOpenTeacherPickerId] = useState<number | null>(null);
  const [actingClassSubjectId, setActingClassSubjectId] = useState<number | null>(null);
  const [subjectActionDialog, setSubjectActionDialog] = useState<{
    open: boolean;
    type: "revoke" | "delete";
    mapping: ClassSubjectMapping | null;
  }>({
    open: false,
    type: "revoke",
    mapping: null,
  });
  const selectedAcademicYearId = localStorage.getItem("selectedAcademicYearId") || "";
  const selectedAcademicYearName =
    localStorage.getItem("selectedAcademicYearName") || "Belum dipilih";
  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    subject_ids: [] as string[],
  });
  const [showAssignHomeroomDialog, setShowAssignHomeroomDialog] = useState(false);
  const [homeroomCandidates, setHomeroomCandidates] = useState<UserListItem[]>([]);
  const [selectedHomeroomUserId, setSelectedHomeroomUserId] = useState("");
  const [isAssigningHomeroom, setIsAssigningHomeroom] = useState(false);
  const [isHomeroomCandidatesLoading, setIsHomeroomCandidatesLoading] = useState(false);
  const [openHomeroomUserPicker, setOpenHomeroomUserPicker] = useState(false);
  const [isRevokingHomeroom, setIsRevokingHomeroom] = useState(false);
  const [revokeHomeroomDialog, setRevokeHomeroomDialog] = useState<{
    open: boolean;
    assignment: ClassDetail["homeroom_assignments"][number] | null;
  }>({
    open: false,
    assignment: null,
  });
  const [showEnrollStudentDialog, setShowEnrollStudentDialog] = useState(false);
  const [enrollmentCandidates, setEnrollmentCandidates] = useState<StudentListItem[]>([]);
  const [selectedEnrollmentStudentId, setSelectedEnrollmentStudentId] = useState("");
  const [isEnrollmentCandidatesLoading, setIsEnrollmentCandidatesLoading] = useState(false);
  const [isEnrollingStudent, setIsEnrollingStudent] = useState(false);
  const [openEnrollmentStudentPicker, setOpenEnrollmentStudentPicker] = useState(false);
  const [isDisenrollingStudent, setIsDisenrollingStudent] = useState(false);
  const [disenrollDialog, setDisenrollDialog] = useState<{
    open: boolean;
    student: ClassDetail["students"][number] | null;
  }>({
    open: false,
    student: null,
  });
  const [classSubjectsPage, setClassSubjectsPage] = useState(1);
  const [studentsPage, setStudentsPage] = useState(1);
  const [classSubjectsPageSize, setClassSubjectsPageSize] = useState(5);
  const [studentsPageSize, setStudentsPageSize] = useState(8);

  const classId = Number(id);

  const loadClassSubjects = useCallback(
    async () => {
      if (!Number.isFinite(classId)) return;

      if (!selectedAcademicYearId) {
        setClassSubjects([]);
        setTeachingAssignments([]);
        return;
      }

      try {
        setIsSubjectsLoading(true);
        const [classSubjectResponse, teachingAssignmentResponse] = await Promise.all([
          scheduleService.listClassSubjects({
            class_id: classId,
            academic_year_id: Number(selectedAcademicYearId),
            include_inactive: true,
            limit: 100,
          }),
          scheduleService.listTeachingAssignments({
            class_id: classId,
            academic_year_id: Number(selectedAcademicYearId),
            include_inactive: true,
            limit: 100,
          }),
        ]);

        setClassSubjects(classSubjectResponse.data);
        setTeachingAssignments(teachingAssignmentResponse.data);
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

  const loadClassData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const res = await classService.getById(parseInt(id, 10));
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
  }, [id]);

  const loadEnrollmentCandidates = useCallback(async () => {
    try {
      setIsEnrollmentCandidatesLoading(true);

      const allStudentsPromise = studentService.list({ limit: 100 });
      const enrolledStudentsPromise = selectedAcademicYearId
        ? studentService.list({
            limit: 100,
            academic_year_id: Number(selectedAcademicYearId),
          })
        : Promise.resolve({
            success: true,
            message: "",
            data: [] as StudentListItem[],
            meta: { total: 0, page: 1, limit: 100, totalPages: 0 },
          });

      const [allStudentsRes, enrolledStudentsRes] = await Promise.all([
        allStudentsPromise,
        enrolledStudentsPromise,
      ]);

      const enrolledStudentIds = new Set(enrolledStudentsRes.data.map((student) => student.id));
      setEnrollmentCandidates(
        allStudentsRes.data.filter(
          (student) => student.is_active && !enrolledStudentIds.has(student.id)
        )
      );
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat kandidat siswa";
      toast.error(message);
    } finally {
      setIsEnrollmentCandidatesLoading(false);
    }
  }, [selectedAcademicYearId]);

  useEffect(() => {
    void loadClassData();
  }, [loadClassData]);

  useEffect(() => {
    async function loadReferenceData() {
      try {
        const [subjectRes, teacherRes] = await Promise.all([
          subjectService.list({ limit: 100 }),
          teacherService.list({ limit: 100 }),
        ]);
        setSubjects(subjectRes.data.filter((subject) => subject.is_active));
        setTeachers(teacherRes.data.filter((teacher) => teacher.is_active));
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat referensi mapel/guru kelas";
        toast.error(message);
      }
    }

    loadReferenceData();
  }, []);

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

  useEffect(() => {
    void loadEnrollmentCandidates();
  }, [loadEnrollmentCandidates]);

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

  const selectedHomeroomUser = useMemo(() => {
    return homeroomCandidates.find((user) => String(user.id) === selectedHomeroomUserId) || null;
  }, [homeroomCandidates, selectedHomeroomUserId]);

  const selectedEnrollmentStudent = useMemo(() => {
    return (
      enrollmentCandidates.find((student) => String(student.id) === selectedEnrollmentStudentId) || null
    );
  }, [enrollmentCandidates, selectedEnrollmentStudentId]);

  const activeTeacherByClassSubjectId = useMemo(() => {
    const map = new Map<number, TeachingAssignment["teacher"]>();

    for (const assignment of teachingAssignments) {
      if (!assignment.is_active) continue;
      if (!map.has(assignment.class_subject_id)) {
        map.set(assignment.class_subject_id, assignment.teacher);
      }
    }

    return map;
  }, [teachingAssignments]);

  const activeAssignmentByClassSubjectId = useMemo(() => {
    const map = new Map<number, TeachingAssignment>();

    for (const assignment of teachingAssignments) {
      if (!assignment.is_active) continue;
      if (!map.has(assignment.class_subject_id)) {
        map.set(assignment.class_subject_id, assignment);
      }
    }

    return map;
  }, [teachingAssignments]);

  const classSubjectsTotalPages = Math.max(
    1,
    Math.ceil(classSubjects.length / classSubjectsPageSize)
  );

  const paginatedClassSubjects = useMemo(() => {
    const startIndex = (classSubjectsPage - 1) * classSubjectsPageSize;
    return classSubjects.slice(startIndex, startIndex + classSubjectsPageSize);
  }, [classSubjects, classSubjectsPage, classSubjectsPageSize]);

  const classStudents = useMemo(() => classData?.students ?? [], [classData?.students]);

  const studentsTotalPages = Math.max(
    1,
    Math.ceil(classStudents.length / studentsPageSize)
  );

  const paginatedStudents = useMemo(() => {
    const startIndex = (studentsPage - 1) * studentsPageSize;
    return classStudents.slice(startIndex, startIndex + studentsPageSize);
  }, [classStudents, studentsPage, studentsPageSize]);

  useEffect(() => {
    setClassSubjectsPage((currentPage) => Math.min(currentPage, classSubjectsTotalPages));
  }, [classSubjectsTotalPages]);

  useEffect(() => {
    setClassSubjectsPage(1);
  }, [classSubjectsPageSize]);

  useEffect(() => {
    setStudentsPage((currentPage) => Math.min(currentPage, studentsTotalPages));
  }, [studentsTotalPages]);

  useEffect(() => {
    setStudentsPage(1);
  }, [studentsPageSize]);

  function handleClassSubjectsPageSizeChange(nextPageSize: number) {
    setClassSubjectsPage(1);
    setClassSubjectsPageSize(nextPageSize);
  }

  function handleStudentsPageSizeChange(nextPageSize: number) {
    setStudentsPage(1);
    setStudentsPageSize(nextPageSize);
  }

  const openSubjectActionDialog = (type: "revoke" | "delete", mapping: ClassSubjectMapping) => {
    setSubjectActionDialog({ open: true, type, mapping });
  };

  const handleInlineTeacherChange = async (
    mapping: ClassSubjectMapping,
    nextTeacherId: string
  ) => {
    if (!mapping.is_active) {
      notify("warning", "Mapel tidak aktif, guru pengajar tidak bisa diubah");
      return;
    }

    const currentAssignment = activeAssignmentByClassSubjectId.get(mapping.id);
    const currentTeacherId = currentAssignment
      ? String(currentAssignment.teacher.id)
      : "none";

    if (nextTeacherId === currentTeacherId) {
      return;
    }

    try {
      setUpdatingClassSubjectId(mapping.id);

      if (currentAssignment) {
        await scheduleService.revokeTeachingAssignment(currentAssignment.id);
      }

      if (nextTeacherId !== "none") {
        await scheduleService.createTeachingAssignment({
          class_subject_id: mapping.id,
          teacher_id: Number(nextTeacherId),
        });
      }

      notify("success", "Guru pengajar berhasil diperbarui");
      await loadClassSubjects();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui guru pengajar";
      notify("error", message);
    } finally {
      setUpdatingClassSubjectId(null);
    }
  };

  const handleClassSubjectAction = async () => {
    const mapping = subjectActionDialog.mapping;

    if (!mapping) {
      return;
    }

    try {
      setActingClassSubjectId(mapping.id);

      if (subjectActionDialog.type === "revoke") {
        const currentAssignment = activeAssignmentByClassSubjectId.get(mapping.id);

        if (currentAssignment) {
          await scheduleService.revokeTeachingAssignment(currentAssignment.id);
        }

        await scheduleService.revokeClassSubject(mapping.id);
        notify("success", "Mapel kelas berhasil dicabut");
      } else {
        await scheduleService.deleteClassSubject(mapping.id);
        notify("success", "Mapel kelas berhasil dihapus permanen");
      }

      setOpenTeacherPickerId((prev) => (prev === mapping.id ? null : prev));
      setSubjectActionDialog({ open: false, type: "revoke", mapping: null });
      await loadClassSubjects();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memproses aksi mapel kelas";
      notify("error", message);
    } finally {
      setActingClassSubjectId(null);
    }
  };

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

  const handleAssignHomeroom = async () => {
    if (!classData) return;

    if (!selectedAcademicYearId) {
      notify("error", "Pilih tahun akademik terlebih dahulu");
      return;
    }

    if (!selectedHomeroomUserId) {
      notify("error", "Pilih guru untuk ditetapkan sebagai wali kelas");
      return;
    }

    try {
      setIsAssigningHomeroom(true);
      await dutyService.assignHomeroom({
        userId: Number(selectedHomeroomUserId),
        classId: classData.id,
        academicYearId: Number(selectedAcademicYearId),
      });

      notify("success", "Wali kelas berhasil ditambahkan");
      setShowAssignHomeroomDialog(false);
      setOpenHomeroomUserPicker(false);
      setSelectedHomeroomUserId("");
      await loadClassData();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambahkan wali kelas";
      notify("error", message);
    } finally {
      setIsAssigningHomeroom(false);
    }
  };

  const handleRevokeHomeroom = async () => {
    const assignment = revokeHomeroomDialog.assignment;

    if (!classData || !assignment) {
      return;
    }

    try {
      setIsRevokingHomeroom(true);
      await dutyService.revokeHomeroom({
        classId: classData.id,
        academicYearId: assignment.academic_year.id,
      });

      notify("success", "Wali kelas berhasil dicabut");
      setRevokeHomeroomDialog({ open: false, assignment: null });
      await loadClassData();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mencabut wali kelas";
      notify("error", message);
    } finally {
      setIsRevokingHomeroom(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!classData) return;

    if (!selectedAcademicYearId) {
      notify("error", "Pilih tahun akademik terlebih dahulu");
      return;
    }

    if (!selectedEnrollmentStudentId) {
      notify("error", "Pilih siswa yang akan dienroll");
      return;
    }

    const selectedStudentId = Number(selectedEnrollmentStudentId);
    const alreadyEnrolled = classData.students.some(
      (student) =>
        student.id === selectedStudentId &&
        student.enrollment.is_active &&
        student.enrollment.academic_year.id === Number(selectedAcademicYearId)
    );

    if (alreadyEnrolled) {
      notify("warning", "Siswa sudah aktif di kelas ini pada tahun ajaran terpilih");
      return;
    }

    try {
      setIsEnrollingStudent(true);
      await studentService.enroll(selectedStudentId, {
        class_id: classData.id,
        academic_year_id: Number(selectedAcademicYearId),
      });

      notify("success", "Enrollment siswa berhasil ditambahkan");
      setShowEnrollStudentDialog(false);
      setOpenEnrollmentStudentPicker(false);
      setSelectedEnrollmentStudentId("");
      await Promise.all([loadClassData(), loadEnrollmentCandidates()]);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambahkan enrollment siswa";
      notify("error", message);
    } finally {
      setIsEnrollingStudent(false);
    }
  };

  const handleDisenrollStudent = async () => {
    const targetStudent = disenrollDialog.student;

    if (!targetStudent) {
      return;
    }

    try {
      setIsDisenrollingStudent(true);
      await studentService.disenroll(targetStudent.id, targetStudent.enrollment.id);

      notify("success", "Enrollment siswa berhasil diakhiri");
      setDisenrollDialog({ open: false, student: null });
      await Promise.all([loadClassData(), loadEnrollmentCandidates()]);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengakhiri enrollment siswa";
      notify("error", message);
    } finally {
      setIsDisenrollingStudent(false);
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
      <div className="relative overflow-hidden rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-200/35 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
              <Link to="/kelas">
                <ArrowLeft className="mr-2 size-4" />
                Kembali
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{classData.name}</h1>
            <p className="max-w-xl text-slate-600">Detail informasi kelas dan pengelolaan relasi akademik</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="w-fit">Kode: {classData.code}</Badge>
            <Badge variant="outline" className="w-fit">Tingkat: {classData.level ?? "-"}</Badge>
          </div>
        </div>
      </div>

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

      <CollapsibleSection
        title="Mata Pelajaran Kelas"
        description="Daftar mapel pada kelas ini berdasarkan tahun ajaran login"
        icon={BookOpen}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="w-fit">
              Tahun Ajaran: {selectedAcademicYearName}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubjectForm({ subject_ids: [] });
                setShowAddSubjectDialog(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Tambah Mapel
            </Button>
          </div>
        }
      >
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
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border">
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">Kode Mapel</TableHead>
                      <TableHead>Nama Mapel</TableHead>
                      <TableHead>Guru Pengajar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClassSubjects.map((mapping) => (
                      <TableRow key={mapping.id}>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                        {mapping.subject.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {mapping.subject.name}
                      </TableCell>
                      <TableCell>
                        <Popover
                          open={openTeacherPickerId === mapping.id}
                          onOpenChange={(open) => {
                            setOpenTeacherPickerId(open ? mapping.id : null);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="h-9 min-w-56 justify-between"
                              disabled={
                                !mapping.is_active ||
                                isSubjectsLoading ||
                                updatingClassSubjectId === mapping.id
                              }
                            >
                              <span className="truncate text-left">
                                {activeTeacherByClassSubjectId.get(mapping.id)
                                  ? `${activeTeacherByClassSubjectId.get(mapping.id)?.name} (${activeTeacherByClassSubjectId.get(mapping.id)?.nip || "-"})`
                                  : "Belum ditugaskan"}
                              </span>
                              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[320px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Cari guru (nama/NIP)..." />
                              <CommandList>
                                <CommandEmpty>Guru tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="Belum ditugaskan"
                                    onSelect={() => {
                                      void handleInlineTeacherChange(mapping, "none");
                                      setOpenTeacherPickerId(null);
                                    }}
                                  >
                                    Belum ditugaskan
                                    {!activeTeacherByClassSubjectId.get(mapping.id) && (
                                      <Check className="ml-auto size-4" />
                                    )}
                                  </CommandItem>
                                  {teachers.map((teacher) => {
                                    const isSelected =
                                      activeTeacherByClassSubjectId.get(mapping.id)?.id === teacher.id;

                                    return (
                                      <CommandItem
                                        key={teacher.id}
                                        value={`${teacher.name} ${teacher.nip || ""}`}
                                        onSelect={() => {
                                          void handleInlineTeacherChange(mapping, String(teacher.id));
                                          setOpenTeacherPickerId(null);
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span>{teacher.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            NIP: {teacher.nip || "-"}
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
                      <TableCell>
                        <Badge
                          variant={mapping.is_active ? "default" : "secondary"}
                        >
                          {mapping.is_active ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={
                              !mapping.is_active ||
                              isSubjectsLoading ||
                              updatingClassSubjectId === mapping.id ||
                              actingClassSubjectId === mapping.id
                            }
                            onClick={() => openSubjectActionDialog("revoke", mapping)}
                          >
                            <Undo2 className="mr-2 size-4" />
                            Cabut
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={
                              isSubjectsLoading ||
                              updatingClassSubjectId === mapping.id ||
                              actingClassSubjectId === mapping.id
                            }
                            onClick={() => openSubjectActionDialog("delete", mapping)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                currentPage={classSubjectsPage}
                totalPages={classSubjectsTotalPages}
                totalItems={classSubjects.length}
                pageSize={classSubjectsPageSize}
                pageSizeOptions={[5, 10, 20]}
                itemLabel="mapel"
                onPageChange={setClassSubjectsPage}
                onPageSizeChange={handleClassSubjectsPageSizeChange}
              />
            </div>
          )}
      </CollapsibleSection>

      <Dialog
        open={subjectActionDialog.open}
        onOpenChange={(open) => {
          if (actingClassSubjectId !== null) {
            return;
          }

          if (!open) {
            setSubjectActionDialog({ open: false, type: "revoke", mapping: null });
            return;
          }

          setSubjectActionDialog((prev) => ({ ...prev, open: true }));
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {subjectActionDialog.type === "revoke" ? "Cabut Mapel Kelas" : "Hapus Mapel Kelas"}
            </DialogTitle>
            <DialogDescription>
              {subjectActionDialog.mapping
                ? `Mapel ${subjectActionDialog.mapping.subject.name} (${subjectActionDialog.mapping.subject.code}) pada kelas ini akan ${subjectActionDialog.type === "revoke" ? "dicabut" : "dihapus permanen"}.`
                : "Pilih mapel kelas yang ingin diproses."}
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertDescription>
              {subjectActionDialog.type === "revoke"
                ? "Aksi cabut akan menonaktifkan mapel dari kelas pada tahun ajaran ini."
                : "Aksi hapus akan menghapus permanen mapel kelas beserta assignment guru dan slot jadwal terkait."}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setSubjectActionDialog({ open: false, type: "revoke", mapping: null })
              }
              disabled={actingClassSubjectId !== null}
            >
              Batal
            </Button>
            <Button
              variant={subjectActionDialog.type === "revoke" ? "default" : "destructive"}
              onClick={handleClassSubjectAction}
              disabled={actingClassSubjectId !== null || !subjectActionDialog.mapping}
            >
              {actingClassSubjectId !== null ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses...
                </>
              ) : subjectActionDialog.type === "revoke" ? (
                "Ya, Cabut"
              ) : (
                "Ya, Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeHomerooms && activeHomerooms.length > 0 && (
        <CollapsibleSection
          title="Wali Kelas Aktif"
          description="Guru wali kelas yang saat ini bertugas"
          icon={GraduationCap}
        >
          <div className="overflow-x-auto rounded-xl border">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">NIP</TableHead>
                  <TableHead>Nama Guru</TableHead>
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
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="Riwayat Wali Kelas"
        description="Semua riwayat penugasan wali kelas untuk kelas ini"
        icon={Calendar}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="w-fit">
              Tahun Ajaran: {selectedAcademicYearName}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedAcademicYearId}
              onClick={() => {
                setSelectedHomeroomUserId("");
                setOpenHomeroomUserPicker(false);
                setShowAssignHomeroomDialog(true);
              }}
            >
              <UserPlus className="mr-2 size-4" />
              Tambah Wali Kelas
            </Button>
          </div>
        }
      >
          {classData.homeroom_assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <UserCheck className="mb-2 size-6 opacity-50" />
              <p className="text-sm">Belum ada riwayat wali kelas</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table className="min-w-[780px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">NIP</TableHead>
                    <TableHead>Nama Guru</TableHead>
                    <TableHead className="hidden md:table-cell">Ditugaskan</TableHead>
                    <TableHead className="hidden lg:table-cell">Berakhir</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
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
                    <TableCell>
                      <div className="flex justify-end">
                        {h.is_active ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isRevokingHomeroom}
                            onClick={() =>
                              setRevokeHomeroomDialog({
                                open: true,
                                assignment: h,
                              })
                            }
                          >
                            <Undo2 className="mr-2 size-4" />
                            Cabut
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </CollapsibleSection>

      <Dialog
        open={showAssignHomeroomDialog}
        onOpenChange={(open) => {
          setShowAssignHomeroomDialog(open);
          if (!open) {
            setSelectedHomeroomUserId("");
            setOpenHomeroomUserPicker(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-4 text-emerald-600" />
              Tambah Wali Kelas
            </DialogTitle>
            <DialogDescription>
              Tetapkan wali kelas baru untuk {classData.code} - {classData.name} pada tahun akademik login.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Tahun akademik yang digunakan: <span className="font-medium">{selectedAcademicYearName}</span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Pilih Guru</Label>
              <Popover open={openHomeroomUserPicker} onOpenChange={setOpenHomeroomUserPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={isHomeroomCandidatesLoading || isAssigningHomeroom}
                  >
                    <span className="truncate text-left">
                      {selectedHomeroomUser
                        ? `${selectedHomeroomUser.name} (${selectedHomeroomUser.nip || "-"})`
                        : "Pilih guru..."}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari guru (nama/NIP/email)..." />
                    <CommandList>
                      <CommandEmpty>Guru tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {homeroomCandidates.map((user) => {
                          const isSelected = String(user.id) === selectedHomeroomUserId;

                          return (
                            <CommandItem
                              key={user.id}
                              value={`${user.name} ${user.nip || ""} ${user.email || ""}`}
                              onSelect={() => {
                                setSelectedHomeroomUserId(String(user.id));
                                setOpenHomeroomUserPicker(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  NIP: {user.nip || "-"} • {user.email || "tanpa email"}
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
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignHomeroomDialog(false)} disabled={isAssigningHomeroom}>
              Batal
            </Button>
            <Button
              onClick={handleAssignHomeroom}
              disabled={
                isAssigningHomeroom ||
                isHomeroomCandidatesLoading ||
                !selectedAcademicYearId ||
                !selectedHomeroomUserId
              }
            >
              {isAssigningHomeroom ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Simpan Wali Kelas
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={revokeHomeroomDialog.open}
        onOpenChange={(open) => {
          if (isRevokingHomeroom) {
            return;
          }

          if (!open) {
            setRevokeHomeroomDialog({ open: false, assignment: null });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cabut Wali Kelas</DialogTitle>
            <DialogDescription>
              {revokeHomeroomDialog.assignment
                ? `Cabut penugasan wali kelas ${revokeHomeroomDialog.assignment.teacher.name} pada tahun ajaran ${revokeHomeroomDialog.assignment.academic_year.name}?`
                : "Pilih wali kelas yang ingin dicabut."}
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertDescription>
              Penugasan wali kelas akan dihentikan sekarang dan statusnya menjadi tidak aktif.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeHomeroomDialog({ open: false, assignment: null })}
              disabled={isRevokingHomeroom}
            >
              Batal
            </Button>
            <Button
              onClick={handleRevokeHomeroom}
              disabled={isRevokingHomeroom || !revokeHomeroomDialog.assignment}
            >
              {isRevokingHomeroom ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Ya, Cabut"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CollapsibleSection
        title="Daftar Siswa"
        description="Semua riwayat siswa yang pernah terdaftar di kelas ini"
        icon={Users}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="w-fit">
              Tahun Ajaran: {selectedAcademicYearName}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedAcademicYearId}
              onClick={() => {
                setSelectedEnrollmentStudentId("");
                setOpenEnrollmentStudentPicker(false);
                setShowEnrollStudentDialog(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Tambah Enrollment
            </Button>
          </div>
        }
      >
          {classStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <GraduationCap className="mb-2 size-6 opacity-50" />
              <p className="text-sm">Belum ada siswa di kelas ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border">
                <Table className="min-w-[980px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">NIS</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="hidden md:table-cell">Gender</TableHead>
                      <TableHead className="hidden lg:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Tahun Ajaran</TableHead>
                      <TableHead>Status Enroll</TableHead>
                      <TableHead>Status Siswa</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.map((s) => (
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
                      <TableCell>
                        <div className="flex justify-end">
                          {s.enrollment.is_active ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isDisenrollingStudent}
                              onClick={() => setDisenrollDialog({ open: true, student: s })}
                            >
                              <Undo2 className="mr-2 size-4" />
                              Akhiri Enrollment
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                currentPage={studentsPage}
                totalPages={studentsTotalPages}
                totalItems={classStudents.length}
                pageSize={studentsPageSize}
                pageSizeOptions={[5, 10, 20]}
                itemLabel="siswa"
                onPageChange={setStudentsPage}
                onPageSizeChange={handleStudentsPageSizeChange}
              />
            </div>
          )}
      </CollapsibleSection>

      <Dialog
        open={showEnrollStudentDialog}
        onOpenChange={(open) => {
          setShowEnrollStudentDialog(open);
          if (!open) {
            setSelectedEnrollmentStudentId("");
            setOpenEnrollmentStudentPicker(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4 text-emerald-600" />
              Tambah Enrollment Siswa
            </DialogTitle>
            <DialogDescription>
              Daftarkan siswa ke kelas {classData.code} - {classData.name} pada tahun akademik login.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Tahun akademik yang digunakan: <span className="font-medium">{selectedAcademicYearName}</span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Pilih Siswa</Label>
              <Popover
                open={openEnrollmentStudentPicker}
                onOpenChange={setOpenEnrollmentStudentPicker}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={isEnrollmentCandidatesLoading || isEnrollingStudent}
                  >
                    <span className="truncate text-left">
                      {selectedEnrollmentStudent
                        ? `${selectedEnrollmentStudent.name} (${selectedEnrollmentStudent.nis})`
                        : "Pilih siswa..."}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari siswa (nama/NIS/email)..." />
                    <CommandList>
                      <CommandEmpty>Siswa tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {enrollmentCandidates.map((student) => {
                          const isSelected = String(student.id) === selectedEnrollmentStudentId;

                          return (
                            <CommandItem
                              key={student.id}
                              value={`${student.name} ${student.nis} ${student.email || ""}`}
                              onSelect={() => {
                                setSelectedEnrollmentStudentId(String(student.id));
                                setOpenEnrollmentStudentPicker(false);
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{student.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  NIS: {student.nis} • {student.email || "tanpa email"}
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
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEnrollStudentDialog(false)}
              disabled={isEnrollingStudent}
            >
              Batal
            </Button>
            <Button
              onClick={handleEnrollStudent}
              disabled={
                isEnrollingStudent ||
                isEnrollmentCandidatesLoading ||
                !selectedAcademicYearId ||
                !selectedEnrollmentStudentId
              }
            >
              {isEnrollingStudent ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Simpan Enrollment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={disenrollDialog.open}
        onOpenChange={(open) => {
          if (isDisenrollingStudent) {
            return;
          }

          if (!open) {
            setDisenrollDialog({ open: false, student: null });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Akhiri Enrollment Siswa</DialogTitle>
            <DialogDescription>
              {disenrollDialog.student
                ? `Akhiri enrollment ${disenrollDialog.student.name} (${disenrollDialog.student.nis}) pada kelas ini?`
                : "Pilih siswa yang ingin diakhiri enrollment-nya."}
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertDescription>
              Status enrollment siswa pada kelas ini akan diubah menjadi selesai.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisenrollDialog({ open: false, student: null })}
              disabled={isDisenrollingStudent}
            >
              Batal
            </Button>
            <Button
              onClick={handleDisenrollStudent}
              disabled={isDisenrollingStudent || !disenrollDialog.student}
            >
              {isDisenrollingStudent ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Ya, Akhiri"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
