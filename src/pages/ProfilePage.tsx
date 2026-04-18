import { useState, useEffect, useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import axios from "axios";
import { userService } from "@/services/userService";
import type { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Shield, School } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Edit profile
  const [name, setName] = useState("");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const res = await userService.getProfile();
      setProfile(res.data);
      setName(res.data.name);
      setNip(res.data.nip ?? "");
      setEmail(res.data.email);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat profil";
      toast.error(message);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const updates: Record<string, string> = {};
    if (name !== profile.name) updates.name = name;
    if (nip !== (profile.nip ?? "")) updates.nip = nip;
    if (email !== profile.email) updates.email = email;

    if (Object.keys(updates).length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await userService.updateProfile(updates);
      setProfile(res.data);
      toast.success("Profil berhasil diperbarui");
      // Update auth store
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.name = res.data.name;
        parsed.email = res.data.email;
        localStorage.setItem("user", JSON.stringify(parsed));
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui profil";
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password baru minimal 8 karakter");
      return;
    }

    setIsSavingPassword(true);
    try {
      await userService.changePassword({ currentPassword, newPassword });
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengubah password";
      toast.error(message);
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Profil</h1>
        <p className="text-muted-foreground">
          Kelola informasi akun dan keamanan Anda
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nama</p>
              <p className="font-medium">{profile?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NIP</p>
              <p className="font-medium">{profile?.nip ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{profile?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={profile?.is_active ? "default" : "destructive"}>
                {profile?.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <Separator />
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                <Shield className="mr-1 inline size-3" />
                Tugas Aktif
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile?.duties.length === 0 && (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
                {profile?.duties.map((d) => (
                  <Badge key={d.code} variant="secondary">
                    {d.duty_name}
                  </Badge>
                ))}
              </div>
            </div>
            {profile?.homerooms && profile.homerooms.length > 0 && (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  <School className="mr-1 inline size-3" />
                  Wali Kelas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.homerooms.map((h) => (
                    <Badge key={h.homeroom_assignment_id} variant="outline">
                      {h.class_code} — {h.academic_year_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Separator />
            <div className="text-xs text-muted-foreground">
              <p>Dibuat: {profile?.created_at}</p>
              <p>Diperbarui: {profile?.updated_at}</p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Forms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Update Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Profil</CardTitle>
              <CardDescription>Perbarui nama, NIP, dan email Anda</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nip">NIP</Label>
                  <Input
                    id="nip"
                    value={nip}
                    onChange={(e) => setNip(e.target.value.replace(/\D/g, ""))}
                    minLength={5}
                    maxLength={30}
                    placeholder="Opsional"
                  />
                  <p className="text-xs text-muted-foreground">Hanya angka, 5-30 digit</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Simpan Perubahan
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>
                Pastikan password baru minimal 8 karakter
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Password Saat Ini</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSavingPassword}>
                  {isSavingPassword && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Ubah Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
