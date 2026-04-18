import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  Loader2,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { scheduleService } from "@/services/scheduleService";
import { classService } from "@/services/classService";
import type { ScheduleSlot } from "@/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const DAY_NAMES = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

export default function ScheduleManagementPage() {
  // Class Schedule State
  const [selectedClassId, setSelectedClassId] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdatingSlot, setIsUpdatingSlot] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingSlot, setIsDeletingSlot] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<ScheduleSlot | null>(null);
  const [formData, setFormData] = useState({
    teaching_assignment_id: "",
    day_of_week: "",
    start_time: "",
    duration_hours: "1",
    minutes_per_hour: "45",
    room: "",
    notes: "",
  });
  const [editFormData, setEditFormData] = useState({
    day_of_week: "",
    start_time: "",
    end_time: "",
    room: "",
    notes: "",
  });

  const selectedAcademicYearId = localStorage.getItem("selectedAcademicYearId") || "";
  const selectedAcademicYearName =
    localStorage.getItem("selectedAcademicYearName") || "Belum dipilih";

  // Fetch data
  const { data: classesData } = useQuery({
    queryKey: ["classes", { limit: 100 }],
    queryFn: () => classService.list({ limit: 100 }),
  });

  // Class Schedule Query
  const {
    data: classScheduleData,
    isLoading: isLoadingClassSchedule,
    refetch: refetchClassSchedule,
  } =
    useQuery({
      queryKey: ["classSchedule", selectedClassId, selectedAcademicYearId],
      queryFn: () =>
        scheduleService.getClassSchedule(
          parseInt(selectedClassId),
          parseInt(selectedAcademicYearId)
        ),
      enabled:
        !!selectedClassId &&
        !!selectedAcademicYearId,
    });

  const { data: teachingAssignmentsData, isLoading: isLoadingTeachingAssignments } =
    useQuery({
      queryKey: ["teachingAssignmentsForClass", selectedClassId, selectedAcademicYearId],
      queryFn: () =>
        scheduleService.listTeachingAssignments({
          class_id: parseInt(selectedClassId),
          academic_year_id: parseInt(selectedAcademicYearId),
          include_inactive: false,
          limit: 100,
        }),
      enabled: !!selectedClassId && !!selectedAcademicYearId,
    });

  const resetForm = () => {
    setFormData({
      teaching_assignment_id: "",
      day_of_week: "",
      start_time: "",
      duration_hours: "1",
      minutes_per_hour: "45",
      room: "",
      notes: "",
    });
  };

  const normalizeTimeToSeconds = (time: string) =>
    time.length === 5 ? `${time}:00` : time;

  const normalizeToHHmm = (time: string) => {
    const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hour = Number(match[1]);
    const minute = Number(match[2]);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const isValid24HourTime = (time: string) =>
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

  const addDurationToTime = (
    time: string,
    durationHours: number,
    minutesPerHour: number
  ) => {
    if (!isValid24HourTime(time)) return null;

    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes =
      hours * 60 + minutes + durationHours * minutesPerHour;

    // Satu sesi harus selesai di hari yang sama.
    if (totalMinutes >= 24 * 60) return null;

    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
  };

  const buildSessionRanges = (
    startTime: string,
    durationHours: number,
    minutesPerHour: number
  ) => {
    const ranges: Array<{ start: string; end: string }> = [];
    let currentStart = startTime;

    for (let i = 0; i < durationHours; i += 1) {
      const currentEnd = addDurationToTime(currentStart, 1, minutesPerHour);
      if (!currentEnd) return null;

      ranges.push({ start: currentStart, end: currentEnd });
      currentStart = currentEnd;
    }

    return ranges;
  };

  const computedEndTime =
    normalizeToHHmm(formData.start_time) &&
    formData.duration_hours &&
    formData.minutes_per_hour
      ? addDurationToTime(
          normalizeToHHmm(formData.start_time) as string,
          parseInt(formData.duration_hours),
          parseInt(formData.minutes_per_hour)
        )
      : "";

  const handleCreateSlot = async () => {
    if (
      !formData.teaching_assignment_id ||
      !formData.day_of_week ||
      !formData.start_time ||
      !formData.duration_hours ||
      !formData.minutes_per_hour
    ) {
      toast.error("Penugasan, hari, jam mulai, jumlah jam, dan menit per jam wajib diisi");
      return;
    }

    const normalizedStartTime = normalizeToHHmm(formData.start_time);
    if (!normalizedStartTime || !isValid24HourTime(normalizedStartTime)) {
      toast.error("Format jam mulai harus 24 jam (HH:mm)");
      return;
    }

    const durationHours = parseInt(formData.duration_hours);
    if (Number.isNaN(durationHours) || durationHours < 1 || durationHours > 5) {
      toast.error("Durasi sesi harus 1 sampai 5 jam");
      return;
    }

    const minutesPerHour = parseInt(formData.minutes_per_hour);
    if (Number.isNaN(minutesPerHour) || minutesPerHour < 1 || minutesPerHour > 45) {
      toast.error("Menit per jam harus 1 sampai 45 menit");
      return;
    }

    const sessionRanges = buildSessionRanges(
      normalizedStartTime,
      durationHours,
      minutesPerHour
    );
    if (!sessionRanges || sessionRanges.length === 0) {
      toast.error("Durasi sesi melewati batas hari, pilih jam mulai yang lebih awal");
      return;
    }

    setIsCreatingSlot(true);
    let createdCount = 0;
    try {
      for (const session of sessionRanges) {
        await scheduleService.createScheduleSlot({
          teaching_assignment_id: parseInt(formData.teaching_assignment_id),
          day_of_week: parseInt(formData.day_of_week),
          start_time: normalizeTimeToSeconds(session.start),
          end_time: normalizeTimeToSeconds(session.end),
          room: formData.room || undefined,
          notes: formData.notes || undefined,
        });
        createdCount += 1;
      }

      toast.success(`${createdCount} sesi jadwal berhasil ditambahkan`);
      setShowCreateDialog(false);
      resetForm();
      await refetchClassSchedule();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal menambahkan jadwal";
      if (createdCount > 0) {
        toast.error(
          `${message}. ${createdCount} sesi sudah berhasil dibuat sebelum error.`
        );
      } else {
        toast.error(message);
      }
      await refetchClassSchedule();
    } finally {
      setIsCreatingSlot(false);
    }
  };

  const openEditDialog = (slot: ScheduleSlot) => {
    setEditingSlotId(slot.id);
    setEditFormData({
      day_of_week: String(slot.day_of_week),
      start_time: slot.start_time?.substring(0, 5) ?? "",
      end_time: slot.end_time?.substring(0, 5) ?? "",
      room: slot.room ?? "",
      notes: slot.notes ?? "",
    });
    setShowEditDialog(true);
  };

  const handleUpdateSlot = async () => {
    if (!editingSlotId) return;

    if (
      !editFormData.day_of_week ||
      !editFormData.start_time ||
      !editFormData.end_time
    ) {
      toast.error("Hari, jam mulai, dan jam selesai wajib diisi");
      return;
    }

    const normalizedStartTime = normalizeToHHmm(editFormData.start_time);
    const normalizedEndTime = normalizeToHHmm(editFormData.end_time);

    if (!normalizedStartTime || !normalizedEndTime) {
      toast.error("Format jam harus 24 jam (HH:mm)");
      return;
    }

    if (normalizedStartTime >= normalizedEndTime) {
      toast.error("Jam selesai harus lebih besar dari jam mulai");
      return;
    }

    setIsUpdatingSlot(true);
    try {
      await scheduleService.updateScheduleSlot(editingSlotId, {
        day_of_week: parseInt(editFormData.day_of_week),
        start_time: normalizeTimeToSeconds(normalizedStartTime),
        end_time: normalizeTimeToSeconds(normalizedEndTime),
        room: editFormData.room || null,
        notes: editFormData.notes || null,
      });

      toast.success("Jadwal berhasil diperbarui");
      setShowEditDialog(false);
      setEditingSlotId(null);
      await refetchClassSchedule();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal memperbarui jadwal";
      toast.error(message);
    } finally {
      setIsUpdatingSlot(false);
    }
  };

  const openDeleteDialog = (slot: ScheduleSlot) => {
    setDeletingSlot(slot);
    setShowDeleteDialog(true);
  };

  const handleDeleteSlot = async () => {
    if (!deletingSlot) return;

    setIsDeletingSlot(true);
    try {
      await scheduleService.deleteScheduleSlot(deletingSlot.id);
      toast.success("Jadwal berhasil dihapus");
      setShowDeleteDialog(false);
      setDeletingSlot(null);
      await refetchClassSchedule();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal menghapus jadwal";
      toast.error(message);
    } finally {
      setIsDeletingSlot(false);
    }
  };

  const availableTeachingAssignments =
    teachingAssignmentsData?.data?.filter((assignment) => assignment.is_active) ?? [];

  // Helper function to render schedule slots
  const renderScheduleSlots = (slots: ScheduleSlot[]) => {
    if (!slots || slots.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tidak ada jadwal untuk periode ini
          </AlertDescription>
        </Alert>
      );
    }

    const slotsByDay = slots.reduce(
      (acc, slot) => {
        if (!acc[slot.day_of_week]) {
          acc[slot.day_of_week] = [];
        }
        acc[slot.day_of_week].push(slot);
        return acc;
      },
      {} as Record<number, ScheduleSlot[]>
    );

    return (
      <div className="space-y-6">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const daySlots = slotsByDay[day] || [];
          if (daySlots.length === 0) return null;

          return (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-base">{DAY_NAMES[day - 1]}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Ruang</TableHead>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead>Guru</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {daySlots
                        .sort((a: ScheduleSlot, b: ScheduleSlot) =>
                          a.start_time.localeCompare(b.start_time)
                        )
                        .map((slot) => (
                          <TableRow key={slot.id}>
                            <TableCell className="font-mono text-sm">
                              {slot.start_time.substring(0, 5)} -{" "}
                              {slot.end_time.substring(0, 5)}
                            </TableCell>
                            <TableCell>
                              {slot.room ? (
                                <Badge variant="outline">{slot.room}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {slot.subject ? (
                                <span className="font-semibold">
                                  {slot.subject.name}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {slot.teacher ? slot.teacher.name : "-"}
                            </TableCell>
                            <TableCell>
                              {slot.class
                                ? `${slot.class.code}`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {slot.notes ? (
                                <span className="max-w-xs truncate">
                                  {slot.notes}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(slot)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => openDeleteDialog(slot)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Jadwal Pembelajaran
        </h1>
        <p className="mt-2 text-gray-600">
          Lihat jadwal pembelajaran berdasarkan kelas pada tahun ajaran login
        </p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Jadwal Kelas
            </CardTitle>
            <CardDescription>
              Pilih kelas untuk melihat jadwal pada tahun ajaran login
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedAcademicYearId ? (
            <Alert>
              <AlertDescription>
                Tahun ajaran login belum ditemukan. Silakan logout lalu login ulang.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Tahun Ajaran: <span className="font-medium text-foreground">{selectedAcademicYearName}</span>
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classesData?.data?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.code} - {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" asChild>
                  <Link to="/jadwal/teaching-assignments">
                    <Users className="h-4 w-4" />
                    Kelola Penugasan Guru
                  </Link>
                </Button>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  disabled={!selectedClassId || !selectedAcademicYearId}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Jadwal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClassId && selectedAcademicYearId && (
        <>
          {isLoadingClassSchedule ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {classScheduleData?.data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {classScheduleData.data.class?.code ?? "-"} -{" "}
                      {classScheduleData.data.class?.name ?? "Kelas tidak tersedia"}
                    </CardTitle>
                    <CardDescription>
                      {classScheduleData.data.academic_year?.name ?? "Tahun akademik tidak tersedia"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderScheduleSlots(
                      classScheduleData.data.slots
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" />
              Tambah Jadwal Kelas
            </DialogTitle>
            <DialogDescription>
              Tambahkan slot jadwal untuk kelas terpilih pada tahun ajaran login.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-13rem)] space-y-4 overflow-y-auto pr-1">
            <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
              Tahun Ajaran: <span className="font-medium text-foreground">{selectedAcademicYearName}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment-select">Penugasan Guru & Mapel</Label>
              <Select
                value={formData.teaching_assignment_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, teaching_assignment_id: value }))
                }
                disabled={isLoadingTeachingAssignments || availableTeachingAssignments.length === 0}
              >
                <SelectTrigger id="assignment-select">
                  <SelectValue
                    placeholder={
                      isLoadingTeachingAssignments
                        ? "Memuat penugasan..."
                        : "Pilih penugasan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachingAssignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id.toString()}>
                      {assignment.subject.name} - {assignment.teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day-select">Hari</Label>
              <Select
                value={formData.day_of_week}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, day_of_week: value }))
                }
              >
                <SelectTrigger id="day-select">
                  <SelectValue placeholder="Pilih hari" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((dayName, index) => (
                    <SelectItem key={dayName} value={(index + 1).toString()}>
                      {dayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="start-time">Jam Mulai</Label>
                <Input
                  id="start-time"
                  type="text"
                  inputMode="numeric"
                  pattern="^([01]\\d|2[0-3]):([0-5]\\d)$"
                  placeholder="07:00"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, start_time: e.target.value }))
                  }
                  onBlur={(e) => {
                    const normalized = normalizeToHHmm(e.target.value);
                    if (normalized) {
                      setFormData((prev) => ({ ...prev, start_time: normalized }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration-hours">Durasi Sesi</Label>
                <Select
                  value={formData.duration_hours}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, duration_hours: value }))
                  }
                >
                  <SelectTrigger id="duration-hours">
                    <SelectValue placeholder="Pilih durasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 jam</SelectItem>
                    <SelectItem value="2">2 jam</SelectItem>
                    <SelectItem value="3">3 jam</SelectItem>
                    <SelectItem value="4">4 jam</SelectItem>
                    <SelectItem value="5">5 jam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minutes-per-hour">Menit per Jam</Label>
                <Input
                  id="minutes-per-hour"
                  type="number"
                  min={1}
                  max={45}
                  placeholder="45"
                  value={formData.minutes_per_hour}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minutes_per_hour: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jam Selesai (Otomatis)</Label>
              <Input
                readOnly
                value={computedEndTime || "-"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Ruang</Label>
              <Input
                id="room"
                placeholder="Contoh: Lab 1"
                value={formData.room}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, room: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Opsional"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button onClick={handleCreateSlot} disabled={isCreatingSlot}>
              {isCreatingSlot ? "Menyimpan..." : "Simpan Jadwal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) {
            setEditingSlotId(null);
            setEditFormData({
              day_of_week: "",
              start_time: "",
              end_time: "",
              room: "",
              notes: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-blue-600" />
              Edit Jadwal Kelas
            </DialogTitle>
            <DialogDescription>
              Perbarui hari, jam, ruang, atau catatan slot jadwal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-day">Hari</Label>
              <Select
                value={editFormData.day_of_week}
                onValueChange={(value) =>
                  setEditFormData((prev) => ({ ...prev, day_of_week: value }))
                }
              >
                <SelectTrigger id="edit-day">
                  <SelectValue placeholder="Pilih hari" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((dayName, index) => (
                    <SelectItem key={dayName} value={(index + 1).toString()}>
                      {dayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-start-time">Jam Mulai</Label>
                <Input
                  id="edit-start-time"
                  type="text"
                  inputMode="numeric"
                  placeholder="07:00"
                  value={editFormData.start_time}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                    }))
                  }
                  onBlur={(e) => {
                    const normalized = normalizeToHHmm(e.target.value);
                    if (normalized) {
                      setEditFormData((prev) => ({
                        ...prev,
                        start_time: normalized,
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-time">Jam Selesai</Label>
                <Input
                  id="edit-end-time"
                  type="text"
                  inputMode="numeric"
                  placeholder="08:30"
                  value={editFormData.end_time}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      end_time: e.target.value,
                    }))
                  }
                  onBlur={(e) => {
                    const normalized = normalizeToHHmm(e.target.value);
                    if (normalized) {
                      setEditFormData((prev) => ({
                        ...prev,
                        end_time: normalized,
                      }));
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-room">Ruang</Label>
              <Input
                id="edit-room"
                placeholder="Contoh: Lab 1"
                value={editFormData.room}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, room: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Catatan</Label>
              <Textarea
                id="edit-notes"
                placeholder="Opsional"
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingSlotId(null);
              }}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateSlot} disabled={isUpdatingSlot}>
              {isUpdatingSlot ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeletingSlot(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" />
              Hapus Jadwal
            </DialogTitle>
            <DialogDescription>
              Jadwal yang dihapus tidak dapat dikembalikan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-md bg-slate-50 p-3 text-sm">
            <p>
              <span className="font-semibold">Hari:</span>{" "}
              {deletingSlot ? DAY_NAMES[deletingSlot.day_of_week - 1] : "-"}
            </p>
            <p>
              <span className="font-semibold">Waktu:</span>{" "}
              {deletingSlot
                ? `${deletingSlot.start_time.substring(0, 5)} - ${deletingSlot.end_time.substring(0, 5)}`
                : "-"}
            </p>
            <p>
              <span className="font-semibold">Mapel:</span>{" "}
              {deletingSlot?.subject?.name ?? "-"}
            </p>
            <p>
              <span className="font-semibold">Guru:</span>{" "}
              {deletingSlot?.teacher?.name ?? "-"}
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingSlot(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSlot}
              disabled={isDeletingSlot}
            >
              {isDeletingSlot ? "Menghapus..." : "Hapus Jadwal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
