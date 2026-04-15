import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { classService } from "@/services/classService";
import type { ClassDetail } from "@/types";
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
  School,
  Hash,
  Layers,
  Calendar,
  UserCheck,
  GraduationCap,
  Users,
} from "lucide-react";

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const activeHomerooms = classData.homeroom_assignments.filter(
    (h) => h.is_active
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/kelas">
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Link>
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

      {/* Active Homeroom */}
      {activeHomerooms.length > 0 && (
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
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama Guru</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Ditugaskan</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeHomerooms.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
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
                    <TableCell className="text-xs text-muted-foreground">
                      {h.assigned_at}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
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
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama Guru</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Ditugaskan</TableHead>
                  <TableHead>Berakhir</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.homeroom_assignments.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {h.teacher.nip ?? "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {h.teacher.name}
                    </TableCell>
                    <TableCell className="text-sm">
                      {h.academic_year.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {h.assigned_at}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
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
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tahun Ajaran</TableHead>
                  <TableHead>Status Enroll</TableHead>
                  <TableHead>Status Siswa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.students.map((s) => (
                  <TableRow key={s.enrollment.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.nis}
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.gender === "M" ? "L" : s.gender === "F" ? "P" : "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.email ?? "-"}</TableCell>
                    <TableCell>
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
    </div>
  );
}
