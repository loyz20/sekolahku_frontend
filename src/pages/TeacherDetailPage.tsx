import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { teacherService } from "@/services/teacherService";
import type { TeacherDetail } from "@/types";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  Loader2,
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
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadTeacher(Number(id));
  }, [id]);

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
                  <TableHead>Ditetapkan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacher.duties.map((duty) => (
                  <TableRow key={duty.code}>
                    <TableCell>
                      <Badge variant="secondary">{duty.code}</Badge>
                    </TableCell>
                    <TableCell>{duty.duty_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {duty.assigned_at}
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
                  <TableHead>Ditetapkan</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {hr.assigned_at}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
