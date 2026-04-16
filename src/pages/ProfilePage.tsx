import { useState, useEffect, useCallback, type FormEvent } from "react";
import { toast } from "sonner";
import axios from "axios";
import { userService } from "@/services/userService";
import { teacherService } from "@/services/teacherService";
import type { TeacherDetail, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

  // Edit teacher fields
  const [teacherProfile, setTeacherProfile] = useState<TeacherDetail | null>(null);
  const [isLoadingTeacher, setIsLoadingTeacher] = useState(false);
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [teacherPlaceOfBirth, setTeacherPlaceOfBirth] = useState("");
  const [teacherDateOfBirth, setTeacherDateOfBirth] = useState("");
  const [teacherGender, setTeacherGender] = useState("-");
  const [teacherAddress, setTeacherAddress] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherSpecialization, setTeacherSpecialization] = useState("");
  const [teacherQualification, setTeacherQualification] = useState("");

  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const res = await userService.getProfile();
      setProfile(res.data);
      setName(res.data.name);
      setNip(res.data.nip ?? "");
      setEmail(res.data.email);
      await loadLinkedTeacher(res.data);
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

  async function loadLinkedTeacher(userProfile: UserProfile) {
    const hasTeacherDuty = userProfile.duties.some(
      (duty) => duty.code === "guru" || duty.duty_name.toLowerCase().includes("guru")
    );

    if (!hasTeacherDuty) {
      setTeacherProfile(null);
      return;
    }

    setIsLoadingTeacher(true);
    try {
      const searchKeyword = userProfile.email || userProfile.nip || userProfile.name;
      const teacherListRes = await teacherService.list({
        limit: 100,
        search: searchKeyword || undefined,
      });

      const match =
        teacherListRes.data.find((teacher) => teacher.email === userProfile.email) ||
        teacherListRes.data.find((teacher) => teacher.nip === userProfile.nip) ||
        teacherListRes.data.find((teacher) => teacher.name === userProfile.name) ||
        null;

      if (!match) {
        setTeacherProfile(null);
        return;
      }

      const teacherDetailRes = await teacherService.getById(match.id);
      const teacher = teacherDetailRes.data;

      setTeacherProfile(teacher);
      setTeacherPlaceOfBirth(teacher.place_of_birth ?? "");
      setTeacherDateOfBirth(teacher.date_of_birth ?? "");
      setTeacherGender(teacher.gender ?? "-");
      setTeacherAddress(teacher.address ?? "");
      setTeacherPhone(teacher.phone ?? "");
      setTeacherSpecialization(teacher.specialization ?? "");
      setTeacherQualification(teacher.qualification ?? "");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data guru";
      toast.error(message);
    } finally {
      setIsLoadingTeacher(false);
    }
  }

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

  async function handleUpdateTeacherFields(e: FormEvent) {
    e.preventDefault();
    if (!teacherProfile) return;

    const updates: Record<string, string | null> = {};
    if (teacherPlaceOfBirth !== (teacherProfile.place_of_birth ?? "")) {
      updates.place_of_birth = teacherPlaceOfBirth || null;
    }
    if (teacherDateOfBirth !== (teacherProfile.date_of_birth ?? "")) {
      updates.date_of_birth = teacherDateOfBirth || null;
    }
    if (teacherGender !== (teacherProfile.gender ?? "-")) {
      updates.gender = teacherGender === "-" ? null : teacherGender;
    }
    if (teacherAddress !== (teacherProfile.address ?? "")) {
      updates.address = teacherAddress || null;
    }
    if (teacherPhone !== (teacherProfile.phone ?? "")) {
      updates.phone = teacherPhone || null;
    }
    if (teacherSpecialization !== (teacherProfile.specialization ?? "")) {
      updates.specialization = teacherSpecialization || null;
    }
    if (teacherQualification !== (teacherProfile.qualification ?? "")) {
      updates.qualification = teacherQualification || null;
    }

    if (Object.keys(updates).length === 0) {
      toast.info("Tidak ada perubahan data guru");
      return;
    }

    setIsSavingTeacher(true);
    try {
      const res = await teacherService.update(teacherProfile.id, updates);
      const updated = res.data;
      setTeacherProfile(updated);
      setTeacherPlaceOfBirth(updated.place_of_birth ?? "");
      setTeacherDateOfBirth(updated.date_of_birth ?? "");
      setTeacherGender(updated.gender ?? "-");
      setTeacherAddress(updated.address ?? "");
      setTeacherPhone(updated.phone ?? "");
      setTeacherSpecialization(updated.specialization ?? "");
      setTeacherQualification(updated.qualification ?? "");
      toast.success("Data guru berhasil diperbarui");
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memperbarui data guru";
      toast.error(message);
    } finally {
      setIsSavingTeacher(false);
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
          {/* Update Teacher Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Data Guru</CardTitle>
              <CardDescription>
                Perbarui field profil guru yang terhubung dengan akun ini
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateTeacherFields}>
              <CardContent className="space-y-4">
                {isLoadingTeacher ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Memuat data guru...
                  </div>
                ) : !teacherProfile ? (
                  <p className="text-sm text-muted-foreground">
                    Data guru tidak ditemukan untuk akun ini.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="teacherPlaceOfBirth">Tempat Lahir</Label>
                        <Input
                          id="teacherPlaceOfBirth"
                          value={teacherPlaceOfBirth}
                          onChange={(e) => setTeacherPlaceOfBirth(e.target.value)}
                          placeholder="Opsional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teacherDateOfBirth">Tanggal Lahir</Label>
                        <Input
                          id="teacherDateOfBirth"
                          type="date"
                          value={teacherDateOfBirth}
                          onChange={(e) => setTeacherDateOfBirth(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacherGender">Gender</Label>
                      <Select value={teacherGender} onValueChange={setTeacherGender}>
                        <SelectTrigger id="teacherGender">
                          <SelectValue placeholder="Pilih gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">Tidak ditentukan</SelectItem>
                          <SelectItem value="M">Laki-laki</SelectItem>
                          <SelectItem value="F">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacherAddress">Alamat</Label>
                      <Input
                        id="teacherAddress"
                        value={teacherAddress}
                        onChange={(e) => setTeacherAddress(e.target.value)}
                        placeholder="Opsional"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="teacherPhone">No. HP</Label>
                        <Input
                          id="teacherPhone"
                          value={teacherPhone}
                          onChange={(e) => setTeacherPhone(e.target.value)}
                          placeholder="Opsional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teacherSpecialization">Mata Pelajaran/Keahlian</Label>
                        <Input
                          id="teacherSpecialization"
                          value={teacherSpecialization}
                          onChange={(e) => setTeacherSpecialization(e.target.value)}
                          placeholder="Opsional"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacherQualification">Kualifikasi Pendidikan</Label>
                      <Input
                        id="teacherQualification"
                        value={teacherQualification}
                        onChange={(e) => setTeacherQualification(e.target.value)}
                        placeholder="Opsional"
                      />
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSavingTeacher || !teacherProfile || isLoadingTeacher}>
                  {isSavingTeacher && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Simpan Data Guru
                </Button>
              </CardFooter>
            </form>
          </Card>

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
