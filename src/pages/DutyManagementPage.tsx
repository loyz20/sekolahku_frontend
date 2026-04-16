import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import axios from "axios";
import { dutyService } from "@/services/dutyService";
import { classService } from "@/services/classService";
import { academicYearService } from "@/services/academicYearService";
import { userService } from "@/services/userService";
import type {
  AcademicYear,
  ClassListItem,
  Duty,
  DutyAssignment,
  HomeroomAssignment,
  UserListItem,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Plus,
  Minus,
  Search,
  School,
  Loader2,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function DutyManagementPage() {
  // Search users
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected user
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [duties, setDuties] = useState<DutyAssignment[]>([]);
  const [homerooms, setHomerooms] = useState<HomeroomAssignment[]>([]);
  const [isLoadingDuties, setIsLoadingDuties] = useState(false);

  // Assign Duty dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDutyCodes, setAssignDutyCodes] = useState<string[]>([]);
  const [assignNotes, setAssignNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Revoke Duty dialog
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeDutyCodes, setRevokeDutyCodes] = useState<string[]>([]);
  const [revokeNotes, setRevokeNotes] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  // Assign Homeroom dialog
  const [homeroomAssignOpen, setHomeroomAssignOpen] = useState(false);
  const [homeroomClassId, setHomeroomClassId] = useState("");
  const [homeroomAcademicYearId, setHomeroomAcademicYearId] = useState("");
  const [homeroomNotes, setHomeroomNotes] = useState("");
  const [isAssigningHomeroom, setIsAssigningHomeroom] = useState(false);

  // Reference data for homeroom assignment
  const [availableDuties, setAvailableDuties] = useState<Duty[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassListItem[]>([]);
  const [availableAcademicYears, setAvailableAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoadingReferenceData, setIsLoadingReferenceData] = useState(false);

  // Revoke Homeroom dialog
  const [homeroomRevokeOpen, setHomeroomRevokeOpen] = useState(false);
  const [revokeClassId, setRevokeClassId] = useState("");
  const [revokeAcademicYearId, setRevokeAcademicYearId] = useState("");
  const [revokeHomeroomNotes, setRevokeHomeroomNotes] = useState("");
  const [isRevokingHomeroom, setIsRevokingHomeroom] = useState(false);

  useEffect(() => {
    async function loadReferenceData() {
      setIsLoadingReferenceData(true);
      try {
        const [dutiesRes, classesRes, academicYearsRes] = await Promise.all([
          dutyService.list({ limit: 100 }),
          classService.list({ limit: 100 }),
          academicYearService.list({ limit: 100 }),
        ]);

        setAvailableDuties(dutiesRes.data);
        setAvailableClasses(classesRes.data);
        setAvailableAcademicYears(
          [...academicYearsRes.data].sort((left, right) => {
            if (left.is_active !== right.is_active) {
              return Number(right.is_active) - Number(left.is_active);
            }

            return right.created_at.localeCompare(left.created_at);
          })
        );
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat data referensi";
        toast.error(message);
      } finally {
        setIsLoadingReferenceData(false);
      }
    }

    loadReferenceData();
  }, []);

  const selectedClass = availableClasses.find(
    (classItem) => classItem.id === Number(homeroomClassId)
  );
  const selectedAcademicYear = availableAcademicYears.find(
    (academicYear) => academicYear.id === Number(homeroomAcademicYearId)
  );

  const defaultDutyOptions = [
    "superadmin",
    "kepala_sekolah",
    "admin",
    "guru",
    "wali_kelas",
  ];

  const dutyOptions = Array.from(
    new Set([
      ...defaultDutyOptions,
      ...availableDuties.map((duty) => duty.code),
      ...duties.map((duty) => duty.duty_code),
      ...searchResults.flatMap((user) => user.duties),
    ])
  ).sort((left, right) => left.localeCompare(right));

  const activeDutyCodes = duties.map((duty) => duty.duty_code);

  function toggleAssignDuty(code: string) {
    setAssignDutyCodes((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  }

  function toggleRevokeDuty(code: string) {
    setRevokeDutyCodes((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  }

  async function handleSearchUsers(e: FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Masukkan nama atau NIP untuk mencari");
      return;
    }
    setIsSearching(true);
    setSelectedUser(null);
    setDuties([]);
    setHomerooms([]);
    try {
      const res = await userService.listUsers({
        search: searchQuery.trim(),
        limit: 10,
      });
      setSearchResults(res.data);

      if (res.data.length === 0) {
        toast.info("Pengguna tidak ditemukan");
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mencari pengguna";
      toast.error(message);
    } finally {
      setIsSearching(false);
    }
  }

  async function selectUser(user: UserListItem) {
    setSelectedUser(user);
    setIsLoadingDuties(true);
    try {
      const res = await dutyService.getUserActiveDuties(user.id);
      setDuties(res.data.duties);
      setHomerooms(res.data.homerooms);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mengambil data tugas";
      toast.error(message);
    } finally {
      setIsLoadingDuties(false);
    }
  }

  function refreshData() {
    if (selectedUser) {
      selectUser(selectedUser);
    }
  }

  async function handleAssignDuty(e: FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    if (assignDutyCodes.length === 0) {
      toast.error("Pilih minimal satu tugas");
      return;
    }

    setIsAssigning(true);
    try {
      const results = await Promise.allSettled(
        assignDutyCodes.map((dutyCode) =>
          dutyService.assignDuty({
            userId: selectedUser.id,
            dutyCode,
            notes: assignNotes || undefined,
          })
        )
      );

      const successCount = results.filter(
        (result) => result.status === "fulfilled"
      ).length;

      if (successCount > 0) {
        toast.success(`${successCount} tugas berhasil ditetapkan`);
        setAssignOpen(false);
        setAssignDutyCodes([]);
        setAssignNotes("");
        refreshData();
      }

      if (successCount < assignDutyCodes.length) {
        toast.error("Sebagian tugas gagal ditetapkan");
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menetapkan tugas";
      toast.error(message);
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleRevokeDuty(e: FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    if (revokeDutyCodes.length === 0) {
      toast.error("Pilih minimal satu tugas aktif");
      return;
    }

    setIsRevoking(true);
    try {
      const results = await Promise.allSettled(
        revokeDutyCodes.map((dutyCode) =>
          dutyService.revokeDuty({
            userId: selectedUser.id,
            dutyCode,
            notes: revokeNotes || undefined,
          })
        )
      );

      const successCount = results.filter(
        (result) => result.status === "fulfilled"
      ).length;

      if (successCount > 0) {
        toast.success(`${successCount} tugas berhasil dicabut`);
        setRevokeOpen(false);
        setRevokeDutyCodes([]);
        setRevokeNotes("");
        refreshData();
      }

      if (successCount < revokeDutyCodes.length) {
        toast.error("Sebagian tugas gagal dicabut");
      }
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mencabut tugas";
      toast.error(message);
    } finally {
      setIsRevoking(false);
    }
  }

  async function handleAssignHomeroom(e: FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setIsAssigningHomeroom(true);
    try {
      await dutyService.assignHomeroom({
        userId: selectedUser.id,
        classId: Number(homeroomClassId),
        academicYearId: Number(homeroomAcademicYearId),
        notes: homeroomNotes || undefined,
      });
      toast.success("Wali kelas berhasil ditetapkan");
      setHomeroomAssignOpen(false);
      setHomeroomClassId("");
      setHomeroomAcademicYearId("");
      setHomeroomNotes("");
      refreshData();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal menetapkan wali kelas";
      toast.error(message);
    } finally {
      setIsAssigningHomeroom(false);
    }
  }

  async function handleRevokeHomeroom(e: FormEvent) {
    e.preventDefault();
    setIsRevokingHomeroom(true);
    try {
      await dutyService.revokeHomeroom({
        classId: Number(revokeClassId),
        academicYearId: Number(revokeAcademicYearId),
        notes: revokeHomeroomNotes || undefined,
      });
      toast.success("Wali kelas berhasil dicabut");
      setHomeroomRevokeOpen(false);
      setRevokeClassId("");
      setRevokeAcademicYearId("");
      setRevokeHomeroomNotes("");
      refreshData();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal mencabut wali kelas";
      toast.error(message);
    } finally {
      setIsRevokingHomeroom(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Tugas</h1>
        <p className="text-muted-foreground">
          Kelola penugasan (duty) dan wali kelas pengguna
        </p>
      </div>

      {/* Search user */}
      <Card>
        <CardHeader>
          <CardTitle>Cari Pengguna</CardTitle>
          <CardDescription>
            Masukkan nama, email, atau NIP untuk mencari pengguna
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearchUsers} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="searchQuery">Nama / Email / NIP</Label>
              <Input
                id="searchQuery"
                placeholder="Contoh: Guru A atau 198504132010011001"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Search className="mr-2 size-4" />
              )}
              Cari
            </Button>
          </form>

          {/* Search results */}
          {searchResults.length > 0 && !selectedUser && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">NIP</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Tugas</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                      {user.nip ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{user.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.duties.map((d) => (
                          <Badge key={d} variant="secondary" className="text-xs">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => selectUser(user)}>
                        Pilih
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Selected user badge */}
          {selectedUser && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <UserIcon className="size-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedUser.nip ? `NIP: ${selectedUser.nip} · ` : ""}
                  {selectedUser.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedUser(null);
                  setDuties([]);
                  setHomerooms([]);
                }}
              >
                Ganti
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && isLoadingDuties && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Memuat data tugas...
          </CardContent>
        </Card>
      )}

      {selectedUser && !isLoadingDuties && (
        <Tabs defaultValue="duties">
          <TabsList>
            <TabsTrigger value="duties" className="gap-2">
              <Shield className="size-4" />
              Tugas ({duties.length})
            </TabsTrigger>
            <TabsTrigger value="homerooms" className="gap-2">
              <School className="size-4" />
              Wali Kelas ({homerooms.length})
            </TabsTrigger>
          </TabsList>

          {/* Duties Tab */}
          <TabsContent value="duties">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tugas Aktif</CardTitle>
                  <CardDescription>
                    Daftar tugas aktif untuk {selectedUser.name}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {/* Assign Duty Dialog */}
                  <Dialog
                    open={assignOpen}
                    onOpenChange={(open) => {
                      setAssignOpen(open);
                      if (!open) {
                        setAssignDutyCodes([]);
                        setAssignNotes("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 size-4" />
                        Tetapkan Tugas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader className="space-y-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
                          <Plus className="size-5 text-emerald-600" />
                        </div>
                        <div>
                          <DialogTitle>Tetapkan Tugas</DialogTitle>
                          <DialogDescription>
                            Tetapkan tugas baru untuk pengguna
                          </DialogDescription>
                        </div>
                      </DialogHeader>
                      <Separator />

                      {/* User preview card */}
                      {selectedUser && (
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                          <Avatar className="size-10">
                            <AvatarImage />
                            <AvatarFallback>
                              {selectedUser.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {selectedUser.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {selectedUser.nip || "Tanpa NIP"}
                            </p>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleAssignDuty} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Pilih Tugas (Bisa Lebih dari 1)
                          </Label>
                          <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                            {dutyOptions.map((code) => {
                              const isSelected = assignDutyCodes.includes(code);
                              const isActive = activeDutyCodes.includes(code);
                              return (
                                <Button
                                  key={code}
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  className="h-8 rounded-full px-3"
                                  onClick={() => toggleAssignDuty(code)}
                                  disabled={isActive}
                                >
                                  {code}
                                  {isActive && (
                                    <Badge variant="secondary" className="ml-2 text-[10px]">
                                      Aktif
                                    </Badge>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Dipilih: {assignDutyCodes.length} tugas
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assignNotes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Catatan (opsional)
                          </Label>
                          <Textarea
                            id="assignNotes"
                            placeholder="Contoh: Penugasan khusus untuk semester 1..."
                            value={assignNotes}
                            onChange={(e) => setAssignNotes(e.target.value)}
                            maxLength={255}
                            className="min-h-20 resize-none text-sm"
                          />
                        </div>

                        <Alert className="border-emerald-200 bg-emerald-50">
                          <CheckCircle2 className="size-4 text-emerald-600" />
                          <AlertDescription className="ml-2 text-xs text-emerald-800">
                            Tugas akan langsung aktif setelah penyimpanan
                          </AlertDescription>
                        </Alert>

                        <Separator />
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAssignOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isAssigning || assignDutyCodes.length === 0}
                          >
                            {isAssigning && (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Tetapkan {assignDutyCodes.length > 0 ? `(${assignDutyCodes.length})` : ""}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Revoke Duty Dialog */}
                  <Dialog
                    open={revokeOpen}
                    onOpenChange={(open) => {
                      setRevokeOpen(open);
                      if (!open) {
                        setRevokeDutyCodes([]);
                        setRevokeNotes("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Minus className="mr-2 size-4" />
                        Cabut Tugas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader className="space-y-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                          <Minus className="size-5 text-red-600" />
                        </div>
                        <div>
                          <DialogTitle>Cabut Tugas</DialogTitle>
                          <DialogDescription>
                            Cabut tugas aktif dari pengguna
                          </DialogDescription>
                        </div>
                      </DialogHeader>
                      <Separator />

                      {/* User preview card */}
                      {selectedUser && (
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                          <Avatar className="size-10">
                            <AvatarImage />
                            <AvatarFallback>
                              {selectedUser.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {selectedUser.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {selectedUser.nip || "Tanpa NIP"}
                            </p>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleRevokeDuty} className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Pilih Tugas Aktif yang Dicabut
                          </Label>
                          <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                            {activeDutyCodes.length === 0 && (
                              <p className="text-xs text-muted-foreground">
                                Pengguna belum memiliki tugas aktif
                              </p>
                            )}
                            {activeDutyCodes.map((code) => {
                              const isSelected = revokeDutyCodes.includes(code);
                              return (
                                <Button
                                  key={code}
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "destructive" : "outline"}
                                  className="h-8 rounded-full px-3"
                                  onClick={() => toggleRevokeDuty(code)}
                                >
                                  {code}
                                </Button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Dipilih: {revokeDutyCodes.length} tugas
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="revokeNotes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Catatan (opsional)
                          </Label>
                          <Textarea
                            id="revokeNotes"
                            placeholder="Contoh: Penugasan sudah berakhir..."
                            value={revokeNotes}
                            onChange={(e) => setRevokeNotes(e.target.value)}
                            maxLength={255}
                            className="min-h-20 resize-none text-sm"
                          />
                        </div>

                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="size-4 text-red-600" />
                          <AlertDescription className="ml-2 text-xs text-red-800">
                            Tugas akan langsung dicabut setelah penyimpanan
                          </AlertDescription>
                        </Alert>

                        <Separator />
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRevokeOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={
                              isRevoking ||
                              activeDutyCodes.length === 0 ||
                              revokeDutyCodes.length === 0
                            }
                          >
                            {isRevoking && (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Cabut {revokeDutyCodes.length > 0 ? `(${revokeDutyCodes.length})` : ""}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {duties.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Shield className="mb-2 size-8 opacity-50" />
                    <p className="text-sm">Tidak ada tugas aktif</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Tugas</TableHead>
                        <TableHead>Tanggal Ditetapkan</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {duties.map((duty) => (
                        <TableRow key={duty.assignment_id}>
                          <TableCell className="font-mono text-xs">
                            {duty.assignment_id}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{duty.duty_code}</Badge>
                          </TableCell>
                          <TableCell>{duty.duty_name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {duty.assigned_at}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {duty.notes ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Homeroom Tab */}
          <TabsContent value="homerooms">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Wali Kelas Aktif</CardTitle>
                  <CardDescription>
                    Daftar penugasan wali kelas untuk {selectedUser?.name}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {/* Assign Homeroom Dialog */}
                  <Dialog
                    open={homeroomAssignOpen}
                    onOpenChange={setHomeroomAssignOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 size-4" />
                        Tetapkan Wali Kelas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader className="space-y-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
                          <School className="size-5 text-blue-600" />
                        </div>
                        <div>
                          <DialogTitle>Tetapkan Wali Kelas</DialogTitle>
                          <DialogDescription>
                            Tetapkan wali kelas untuk pengguna
                          </DialogDescription>
                        </div>
                      </DialogHeader>
                      <Separator />

                      {/* User preview card */}
                      {selectedUser && (
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                          <Avatar className="size-10">
                            <AvatarImage />
                            <AvatarFallback>
                              {selectedUser.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {selectedUser.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {selectedUser.nip || "Tanpa NIP"}
                            </p>
                          </div>
                        </div>
                      )}

                      <form
                        onSubmit={handleAssignHomeroom}
                        className="space-y-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label
                              htmlFor="classId"
                              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                              Pilih Kelas
                            </Label>
                            <Select
                              value={homeroomClassId}
                              onValueChange={setHomeroomClassId}
                              disabled={isLoadingReferenceData}
                            >
                              <SelectTrigger id="classId" className="w-full">
                                <SelectValue
                                  placeholder={
                                    isLoadingReferenceData
                                      ? "Memuat kelas..."
                                      : "Pilih kelas"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {availableClasses.map((classItem) => (
                                  <SelectItem
                                    key={classItem.id}
                                    value={String(classItem.id)}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {classItem.code}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {classItem.name}
                                      </span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {selectedClass
                                ? `${selectedClass.code} · ${selectedClass.name}`
                                : "Pilih kelas tujuan penugasan"}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="academicYearId"
                              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                              Pilih Tahun Akademik
                            </Label>
                            <Select
                              value={homeroomAcademicYearId}
                              onValueChange={setHomeroomAcademicYearId}
                              disabled={isLoadingReferenceData}
                            >
                              <SelectTrigger
                                id="academicYearId"
                                className="w-full"
                              >
                                <SelectValue
                                  placeholder={
                                    isLoadingReferenceData
                                      ? "Memuat tahun ajaran..."
                                      : "Pilih tahun ajaran"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {availableAcademicYears.map((academicYear) => (
                                  <SelectItem
                                    key={academicYear.id}
                                    value={String(academicYear.id)}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {academicYear.code}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {academicYear.name}
                                      </span>
                                      {academicYear.is_active && (
                                        <Badge variant="secondary" className="text-xs">
                                          Aktif
                                        </Badge>
                                      )}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {selectedAcademicYear
                                ? `${selectedAcademicYear.code} · ${selectedAcademicYear.name}`
                                : "Pilih tahun ajaran penugasan"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="homeroomNotes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Catatan (opsional)
                          </Label>
                          <Textarea
                            id="homeroomNotes"
                            placeholder="Contoh: Wali kelas 10A semester 1..."
                            value={homeroomNotes}
                            onChange={(e) => setHomeroomNotes(e.target.value)}
                            maxLength={255}
                            className="min-h-20 resize-none text-sm"
                          />
                        </div>

                        <Alert className="border-blue-200 bg-blue-50">
                          <Clock className="size-4 text-blue-600" />
                          <AlertDescription className="ml-2 text-xs text-blue-800">
                            Penugasan wali kelas akan dimulai dari tanggal penetapan
                          </AlertDescription>
                        </Alert>

                        <Separator />
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setHomeroomAssignOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={isAssigningHomeroom || isLoadingReferenceData}
                          >
                            {isAssigningHomeroom && (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Tetapkan
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Revoke Homeroom Dialog */}
                  <Dialog
                    open={homeroomRevokeOpen}
                    onOpenChange={setHomeroomRevokeOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Minus className="mr-2 size-4" />
                        Cabut Wali Kelas
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader className="space-y-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                          <Minus className="size-5 text-red-600" />
                        </div>
                        <div>
                          <DialogTitle>Cabut Wali Kelas</DialogTitle>
                          <DialogDescription>
                            Cabut penugasan wali kelas dari kelas dan tahun akademik
                          </DialogDescription>
                        </div>
                      </DialogHeader>
                      <Separator />

                      <form
                        onSubmit={handleRevokeHomeroom}
                        className="space-y-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label
                              htmlFor="revokeClassId"
                              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                              Pilih Kelas
                            </Label>
                            <Select
                              value={revokeClassId}
                              onValueChange={setRevokeClassId}
                              disabled={isLoadingReferenceData}
                            >
                              <SelectTrigger id="revokeClassId" className="w-full">
                                <SelectValue
                                  placeholder={
                                    isLoadingReferenceData
                                      ? "Memuat kelas..."
                                      : "Pilih kelas"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {availableClasses.map((classItem) => (
                                  <SelectItem
                                    key={classItem.id}
                                    value={String(classItem.id)}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {classItem.code}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {classItem.name}
                                      </span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="revokeAcademicYearId"
                              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                              Pilih Tahun Akademik
                            </Label>
                            <Select
                              value={revokeAcademicYearId}
                              onValueChange={setRevokeAcademicYearId}
                              disabled={isLoadingReferenceData}
                            >
                              <SelectTrigger
                                id="revokeAcademicYearId"
                                className="w-full"
                              >
                                <SelectValue
                                  placeholder={
                                    isLoadingReferenceData
                                      ? "Memuat tahun ajaran..."
                                      : "Pilih tahun ajaran"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {availableAcademicYears.map((academicYear) => (
                                  <SelectItem
                                    key={academicYear.id}
                                    value={String(academicYear.id)}
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {academicYear.code}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {academicYear.name}
                                      </span>
                                      {academicYear.is_active && (
                                        <Badge variant="secondary" className="text-xs">
                                          Aktif
                                        </Badge>
                                      )}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="revokeHomeroomNotes" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Catatan (opsional)
                          </Label>
                          <Textarea
                            id="revokeHomeroomNotes"
                            placeholder="Contoh: Penugasan berakhir untuk periode ini..."
                            value={revokeHomeroomNotes}
                            onChange={(e) =>
                              setRevokeHomeroomNotes(e.target.value)
                            }
                            maxLength={255}
                            className="min-h-20 resize-none text-sm"
                          />
                        </div>

                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="size-4 text-red-600" />
                          <AlertDescription className="ml-2 text-xs text-red-800">
                            Penugasan wali kelas akan langsung dihentikan
                          </AlertDescription>
                        </Alert>

                        <Separator />
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setHomeroomRevokeOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button
                            type="submit"
                            variant="destructive"
                            size="sm"
                            disabled={isRevokingHomeroom || isLoadingReferenceData}
                          >
                            {isRevokingHomeroom && (
                              <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Cabut
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {homerooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <School className="mb-2 size-8 opacity-50" />
                    <p className="text-sm">Tidak ada penugasan wali kelas</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Tahun Akademik</TableHead>
                        <TableHead>Tanggal Ditetapkan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {homerooms.map((hr) => (
                        <TableRow key={hr.homeroom_assignment_id}>
                          <TableCell className="font-mono text-xs">
                            {hr.homeroom_assignment_id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">
                                {hr.class_code}
                              </span>
                              <span className="ml-2 text-muted-foreground">
                                {hr.class_name}
                              </span>
                            </div>
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
