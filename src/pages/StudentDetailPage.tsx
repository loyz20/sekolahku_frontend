import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { studentService } from "@/services/studentService";
import { classService } from "@/services/classService";
import { academicYearService } from "@/services/academicYearService";
import type { AcademicYear, ClassListItem, StudentDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Plus,
  School,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Trash2,
} from "lucide-react";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  const [disenrollEnrollmentId, setDisenrollEnrollmentId] = useState<number | null>(null);
  const [isDisenrolling, setIsDisenrolling] = useState(false);

  const studentId = Number(id);

  const activeEnrollments = useMemo(
    () => student?.enrollments.filter((enrollment) => enrollment.is_active) ?? [],
    [student]
  );

  async function loadStudent() {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const res = await studentService.getById(studentId);
      setStudent(res.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat detail siswa";
      toast.error(message);
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadReferenceData() {
    try {
      const [classesRes, yearsRes] = await Promise.all([
        classService.list({ limit: 100 }),
        academicYearService.list({ limit: 100 }),
      ]);
      setClasses(classesRes.data);
      setAcademicYears(yearsRes.data);
    } catch {
      // Keep detail usable even if reference data fails.
    }
  }

  useEffect(() => {
    loadStudent();
    loadReferenceData();
  }, [studentId]);

  async function handleEnroll() {
    if (!student || !selectedClassId || !selectedAcademicYearId) {
      toast.error("Pilih kelas dan tahun ajaran");
      return;
    }

    setIsEnrolling(true);
    try {
      await studentService.enroll(student.id, {
        class_id: Number(selectedClassId),
        academic_year_id: Number(selectedAcademicYearId),
      });
      toast.success("Siswa berhasil dienroll");
      setEnrollOpen(false);
      setSelectedClassId("");
      setSelectedAcademicYearId("");
      loadStudent();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menambahkan enrollment";
      toast.error(message);
    } finally {
      setIsEnrolling(false);
    }
  }

  async function handleDisenroll() {
    if (!student || !disenrollEnrollmentId) return;

    setIsDisenrolling(true);
    try {
      await studentService.disenroll(student.id, disenrollEnrollmentId);
      toast.success("Enrollment berhasil diakhiri");
      setDisenrollEnrollmentId(null);
      loadStudent();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengakhiri enrollment";
      toast.error(message);
    } finally {
      setIsDisenrolling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/siswa">
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <GraduationCap className="mb-2 size-8 opacity-50" />
            <p className="text-sm">Siswa tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/siswa">
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Link>
        </Button>
        <Button onClick={() => setEnrollOpen(true)}>
          <Plus className="mr-2 size-4" />
          Tambah Enrollment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="size-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{student.name}</CardTitle>
              <CardDescription>NIS: {student.nis}</CardDescription>
            </div>
            <Badge variant={student.is_active ? "default" : "secondary"} className="ml-auto">
              {student.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <User className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="text-sm font-medium">
                  {student.gender === "M"
                    ? "Laki-laki"
                    : student.gender === "F"
                      ? "Perempuan"
                      : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tanggal Lahir</p>
                <p className="text-sm font-medium">{student.date_of_birth ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Phone className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">No. HP Ortu</p>
                <p className="text-sm font-medium">{student.parent_phone ?? "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{student.email ?? "-"}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-lg border p-3">
            <MapPin className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Alamat</p>
              <p className="text-sm">{student.address ?? "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Aktif</CardTitle>
          <CardDescription>
            Penempatan kelas yang sedang berjalan ({activeEnrollments.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeEnrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <School className="mb-2 size-7 opacity-50" />
              <p className="text-sm">Belum ada enrollment aktif</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Tanggal Mulai</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <span className="font-medium">{enrollment.class.code}</span>
                      <span className="ml-2 text-muted-foreground">
                        {enrollment.class.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{enrollment.academic_year.name}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {enrollment.enrollment_date}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDisenrollEnrollmentId(enrollment.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Enrollment</CardTitle>
          <CardDescription>
            Seluruh riwayat penempatan kelas siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {student.enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <School className="mb-2 size-7 opacity-50" />
              <p className="text-sm">Belum ada riwayat enrollment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead>Selesai</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <span className="font-medium">{enrollment.class.code}</span>
                      <span className="ml-2 text-muted-foreground">
                        {enrollment.class.name}
                      </span>
                    </TableCell>
                    <TableCell>{enrollment.academic_year.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {enrollment.enrollment_date}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {enrollment.ended_date ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={enrollment.is_active ? "default" : "secondary"}>
                        {enrollment.is_active ? "Aktif" : "Selesai"}
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
        open={enrollOpen}
        onOpenChange={(open) => {
          setEnrollOpen(open);
          if (!open) {
            setSelectedClassId("");
            setSelectedAcademicYearId("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Plus className="size-5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Tambah Enrollment</DialogTitle>
                <DialogDescription>
                  Masukkan siswa ke kelas dan tahun ajaran baru
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-3" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <School className="size-4 text-primary" />
                Pilih Kelas <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={String(classItem.id)}>
                      <span className="font-medium">{classItem.code}</span>
                      <span className="ml-2 text-muted-foreground">
                        {classItem.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="size-4 text-primary" />
                Pilih Tahun Ajaran <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedAcademicYearId}
                onValueChange={setSelectedAcademicYearId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tahun ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      <span className="font-medium">{year.code}</span>
                      <span className="ml-2 text-muted-foreground">
                        {year.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator className="my-3" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEnrollOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEnroll} disabled={isEnrolling} className="gap-2">
              {isEnrolling && <Loader2 className="size-4 animate-spin" />}
              <Plus className="size-4" />
              Simpan Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!disenrollEnrollmentId}
        onOpenChange={() => setDisenrollEnrollmentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Akhiri Enrollment</AlertDialogTitle>
            <AlertDialogDescription>
              Enrollment aktif akan diakhiri (soft-delete) sesuai kontrak API.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisenroll} disabled={isDisenrolling}>
              {isDisenrolling && <Loader2 className="mr-2 size-4 animate-spin" />}
              Akhiri
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
