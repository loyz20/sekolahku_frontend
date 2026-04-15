import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { scheduleService } from "@/services/scheduleService";
import { classService } from "@/services/classService";
import { teacherService } from "@/services/teacherService";
import { studentService } from "@/services/studentService";
import { academicYearService } from "@/services/academicYearService";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  const [activeTab, setActiveTab] = useState("class");

  // Class Schedule State
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClassAcademicYearId, setSelectedClassAcademicYearId] =
    useState("");

  // Teacher Schedule State
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedTeacherAcademicYearId, setSelectedTeacherAcademicYearId] =
    useState("");

  // Student Schedule State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudentAcademicYearId, setSelectedStudentAcademicYearId] =
    useState("");

  // Fetch data
  const { data: classesData } = useQuery({
    queryKey: ["classes", { limit: 100 }],
    queryFn: () => classService.list({ limit: 100 }),
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers", { limit: 100 }],
    queryFn: () => teacherService.list({ limit: 100 }),
  });

  const { data: studentsData } = useQuery({
    queryKey: ["students", { limit: 100 }],
    queryFn: () => studentService.list({ limit: 100 }),
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ["academicYears", { limit: 100 }],
    queryFn: () => academicYearService.list({ limit: 100 }),
  });

  // Class Schedule Query
  const { data: classScheduleData, isLoading: isLoadingClassSchedule } =
    useQuery({
      queryKey: ["classSchedule", selectedClassId, selectedClassAcademicYearId],
      queryFn: () =>
        scheduleService.getClassSchedule(
          parseInt(selectedClassId),
          parseInt(selectedClassAcademicYearId)
        ),
      enabled:
        !!selectedClassId &&
        !!selectedClassAcademicYearId,
    });

  // Teacher Schedule Query
  const { data: teacherScheduleData, isLoading: isLoadingTeacherSchedule } =
    useQuery({
      queryKey: [
        "teacherSchedule",
        selectedTeacherId,
        selectedTeacherAcademicYearId,
      ],
      queryFn: () =>
        scheduleService.getTeacherSchedule(
          parseInt(selectedTeacherId),
          parseInt(selectedTeacherAcademicYearId)
        ),
      enabled:
        !!selectedTeacherId &&
        !!selectedTeacherAcademicYearId,
    });

  // Student Schedule Query
  const { data: studentScheduleData, isLoading: isLoadingStudentSchedule } =
    useQuery({
      queryKey: [
        "studentSchedule",
        selectedStudentId,
        selectedStudentAcademicYearId,
      ],
      queryFn: () =>
        scheduleService.getStudentSchedule(
          parseInt(selectedStudentId),
          parseInt(selectedStudentAcademicYearId)
        ),
      enabled:
        !!selectedStudentId &&
        !!selectedStudentAcademicYearId,
    });

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
          Lihat jadwal pembelajaran dari perspektif kelas, guru, atau siswa
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="class" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Jadwal Kelas</span>
          </TabsTrigger>
          <TabsTrigger value="teacher" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Jadwal Guru</span>
          </TabsTrigger>
          <TabsTrigger value="student" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Jadwal Siswa</span>
          </TabsTrigger>
        </TabsList>

        {/* Class Schedule Tab */}
        <TabsContent value="class" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Jadwal Kelas
              </CardTitle>
              <CardDescription>
                Pilih kelas dan tahun akademik untuk melihat jadwal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
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

                <div className="space-y-2">
                  <Label>Tahun Akademik</Label>
                  <Select
                    value={selectedClassAcademicYearId}
                    onValueChange={setSelectedClassAcademicYearId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun akademik" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearsData?.data?.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedClassId && selectedClassAcademicYearId && (
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
                          {classScheduleData.data.academic_year?.code ?? "Tahun akademik tidak tersedia"}
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
        </TabsContent>

        {/* Teacher Schedule Tab */}
        <TabsContent value="teacher" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Jadwal Guru
              </CardTitle>
              <CardDescription>
                Pilih guru dan tahun akademik untuk melihat jadwal mengajar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Guru</Label>
                  <Select
                    value={selectedTeacherId}
                    onValueChange={setSelectedTeacherId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih guru" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachersData?.data?.map((teacher) => (
                        <SelectItem
                          key={teacher.id}
                          value={teacher.id.toString()}
                        >
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tahun Akademik</Label>
                  <Select
                    value={selectedTeacherAcademicYearId}
                    onValueChange={setSelectedTeacherAcademicYearId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun akademik" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearsData?.data?.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedTeacherId && selectedTeacherAcademicYearId && (
            <>
              {isLoadingTeacherSchedule ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {teacherScheduleData?.data && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {teacherScheduleData.data.teacher?.name ?? "Guru tidak tersedia"}
                        </CardTitle>
                        <CardDescription>
                          {teacherScheduleData.data.academic_year?.code ?? "Tahun akademik tidak tersedia"} •{" "}
                          {teacherScheduleData.data.teacher?.nip ?? "-"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderScheduleSlots(
                          teacherScheduleData.data.slots
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </TabsContent>

        {/* Student Schedule Tab */}
        <TabsContent value="student" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Jadwal Siswa
              </CardTitle>
              <CardDescription>
                Pilih siswa dan tahun akademik untuk melihat jadwal pembelajaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Siswa</Label>
                  <Select
                    value={selectedStudentId}
                    onValueChange={setSelectedStudentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih siswa" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsData?.data?.map((student) => (
                        <SelectItem
                          key={student.id}
                          value={student.id.toString()}
                        >
                          {student.name} ({student.nis})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tahun Akademik</Label>
                  <Select
                    value={selectedStudentAcademicYearId}
                    onValueChange={setSelectedStudentAcademicYearId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun akademik" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearsData?.data?.map((year) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedStudentId && selectedStudentAcademicYearId && (
            <>
              {isLoadingStudentSchedule ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {studentScheduleData?.data && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {studentScheduleData.data.student?.name ?? "Siswa tidak tersedia"}
                        </CardTitle>
                        <CardDescription>
                          {studentScheduleData.data.academic_year?.code ?? "Tahun akademik tidak tersedia"} •{" "}
                          {studentScheduleData.data.student?.nis ?? "-"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {renderScheduleSlots(
                          studentScheduleData.data.slots
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Navigation Links Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Manajemen Jadwal
          </CardTitle>
          <CardDescription>
            Kelola data dasar jadwal pembelajaran
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" asChild className="justify-start">
              <a href="/jadwal/class-subjects">
                <BookOpen className="mr-2 h-4 w-4" />
                Manajemen Mapel Kelas
              </a>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <a href="/jadwal/teaching-assignments">
                <Users className="mr-2 h-4 w-4" />
                Manajemen Penugasan Guru
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
