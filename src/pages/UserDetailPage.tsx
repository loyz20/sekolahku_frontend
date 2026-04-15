import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { userService } from "@/services/userService";
import type { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Mail,
  Hash,
  Shield,
  School,
  Calendar,
  User as UserIcon,
} from "lucide-react";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadUser(Number(id));
  }, [id]);

  async function loadUser(userId: number) {
    setIsLoading(true);
    try {
      const res = await userService.getUser(userId);
      setUser(res.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data pengguna";
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

  if (!user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/pengguna")}>
          <ArrowLeft className="mr-2 size-4" />
          Kembali
        </Button>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <UserIcon className="mb-2 size-8 opacity-50" />
          <p>Pengguna tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/pengguna")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground">Detail pengguna #{user.id}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informasi Pengguna</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <UserIcon className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">NIP</p>
                <p className="font-medium">{user.nip ?? "-"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={user.is_active ? "default" : "destructive"}>
                {user.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            {user.is_protected && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Proteksi</span>
                <Badge variant="outline">Protected</Badge>
              </div>
            )}
            <Separator />
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                <p>Dibuat: {user.created_at}</p>
                <p>Diperbarui: {user.updated_at}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duties & Homerooms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Duties */}
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
              {user.duties.length === 0 ? (
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
                    {user.duties.map((duty) => (
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

          {/* Homerooms */}
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
              {user.homerooms.length === 0 ? (
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
                    {user.homerooms.map((hr) => (
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
      </div>
    </div>
  );
}
