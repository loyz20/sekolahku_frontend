import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Plus,
  BookOpen,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { scheduleService } from "@/services/scheduleService";
import { classService } from "@/services/classService";
import { subjectService } from "@/services/subjectService";
import { academicYearService } from "@/services/academicYearService";
import type { ClassSubjectMapping } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { PaginationControls } from "@/components/features/PaginationControls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useNotification } from "@/hooks/use-notification";

export default function ClassSubjectManagementPage() {
  const { notify } = useNotification();
  const [searchParams] = useSearchParams();
  const lockedClassId = searchParams.get("class_id") || "";
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<ClassSubjectMapping | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    class_id: lockedClassId || "",
    subject_ids: [] as string[],
    academic_year_id: "",
  });

  const resetCreateForm = () => {
    setFormData({
      class_id: lockedClassId || "",
      subject_ids: [],
      academic_year_id: "",
    });
  };

  // Filters
  const [filterClassId, setFilterClassId] = useState(lockedClassId || "");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterAcademicYearId, setFilterAcademicYearId] = useState("");

  // Fetch data
  const { data: classesData } = useQuery({
    queryKey: ["classes", { limit: 100 }],
    queryFn: () => classService.list({ limit: 100 }),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects", { limit: 100 }],
    queryFn: () => subjectService.list({ limit: 100 }),
  });

  const { data: academicYearsData } = useQuery({
    queryKey: ["academicYears", { limit: 100 }],
    queryFn: () => academicYearService.list({ limit: 100 }),
  });

  const { data: mappingsData, isLoading, refetch } = useQuery({
    queryKey: [
      "classSubjects",
      {
        page,
          limit: pageSize,
        filterClassId,
        filterSubjectId,
        filterAcademicYearId,
        lockedClassId,
      },
    ],
    queryFn: () =>
      scheduleService.listClassSubjects({
        page,
        limit: pageSize,
        class_id: (lockedClassId || filterClassId)
          ? parseInt(lockedClassId || filterClassId)
          : undefined,
        subject_id: filterSubjectId ? parseInt(filterSubjectId) : undefined,
        academic_year_id: filterAcademicYearId
          ? parseInt(filterAcademicYearId)
          : undefined,
        include_inactive: true,
      }),
  });

  // Handlers
  const handleCreate = async () => {
    if (!formData.class_id || formData.subject_ids.length === 0 || !effectiveAcademicYearId) {
      notify("error", "Semua field harus diisi");
      return;
    }

    try {
      const classId = parseInt(formData.class_id);
      const academicYearId = parseInt(effectiveAcademicYearId);

      // Pre-check active mappings so duplicate subjects are skipped before create.
      const existingMappings = await scheduleService.listClassSubjects({
        class_id: classId,
        academic_year_id: academicYearId,
        include_inactive: false,
        limit: 100,
      });

      const existingSubjectIds = new Set(
        existingMappings.data
          .filter((mapping) => mapping.is_active)
          .map((mapping) => mapping.subject.id.toString())
      );

      const toCreateSubjectIds = formData.subject_ids.filter(
        (subjectId) => !existingSubjectIds.has(subjectId)
      );

      if (toCreateSubjectIds.length === 0) {
        notify(
          "warning",
          "Semua mapel yang dipilih sudah aktif pada kelas dan tahun akademik ini"
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
            class_id: classId,
            subject_id: parseInt(subjectId),
            academic_year_id: academicYearId,
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

      const preSkippedCount = formData.subject_ids.length - toCreateSubjectIds.length;
      const skippedCount = preSkippedCount + conflictCount;
      if (skippedCount > 0) {
        notify(
          "warning",
          `${skippedCount} mapel dilewati karena sudah aktif pada kelas dan tahun akademik ini`
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

      setShowCreateDialog(false);
      setFormData({
        class_id: lockedClassId || "",
        subject_ids: [],
        academic_year_id: "",
      });
      refetch();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal menambahkan mapel ke kelas";
      notify("error", message);
    }
  };

  const handleRevoke = async () => {
    if (!selectedMapping) return;

    try {
      await scheduleService.revokeClassSubject(selectedMapping.id);
      notify("success", "Mapel dari kelas berhasil dihapus");
      setShowDeleteDialog(false);
      setSelectedMapping(null);
      refetch();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Gagal menghapus mapel dari kelas";
      notify("error", message);
    }
  };

  const totalPages = Math.max(1, Math.ceil((mappingsData?.meta?.total || 0) / pageSize));

  function handlePageSizeChange(nextPageSize: number) {
    setPage(1);
    setPageSize(nextPageSize);
  }
  const activeAcademicYearId = useMemo(
    () =>
      academicYearsData?.data
        ?.find((year) => year.is_active)
        ?.id.toString() ?? "",
    [academicYearsData?.data]
  );

  const effectiveAcademicYearId = formData.academic_year_id || activeAcademicYearId;

  const isCreateFormValid =
    Boolean(formData.class_id) &&
    formData.subject_ids.length > 0 &&
    Boolean(effectiveAcademicYearId);

  const selectedClass = useMemo(
    () => classesData?.data?.find((cls) => cls.id === Number(formData.class_id)),
    [classesData?.data, formData.class_id]
  );

  const lockedClass = useMemo(
    () => classesData?.data?.find((cls) => cls.id === Number(lockedClassId)),
    [classesData?.data, lockedClassId]
  );

  const selectedSubjects = useMemo(
    () =>
      subjectsData?.data?.filter((subject) =>
        formData.subject_ids.includes(subject.id.toString())
      ) ?? [],
    [subjectsData?.data, formData.subject_ids]
  );

  const selectedAcademicYear = useMemo(
    () =>
      academicYearsData?.data?.find(
        (year) => year.id === Number(effectiveAcademicYearId)
      ),
    [academicYearsData?.data, effectiveAcademicYearId]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to={lockedClassId ? `/kelas/${lockedClassId}` : "/jadwal"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Manajemen Mapel Kelas
          </h1>
          <p className="mt-2 text-gray-600">
            Kelola penugasan mata pelajaran ke kelas
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah Mapel Kelas
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {lockedClassId ? (
              <div className="space-y-2">
                <Label>Kelas</Label>
                <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm">
                  {lockedClass
                    ? `${lockedClass.code} - ${lockedClass.name}`
                    : "Memuat kelas..."}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={filterClassId || "all"}
                  onValueChange={(value) =>
                    setFilterClassId(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua kelas</SelectItem>
                    {classesData?.data?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.code} - {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Mata Pelajaran</Label>
              <Select
                value={filterSubjectId || "all"}
                onValueChange={(value) =>
                  setFilterSubjectId(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua mapel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua mapel</SelectItem>
                  {subjectsData?.data?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tahun Akademik</Label>
              <Select
                value={filterAcademicYearId || "all"}
                onValueChange={(value) =>
                  setFilterAcademicYearId(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua tahun</SelectItem>
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

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Mapel Kelas</CardTitle>
          <CardDescription>
            Total: {mappingsData?.meta?.total || 0} mapel kelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : mappingsData?.data?.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tidak ada data mapel kelas yang sesuai dengan filter
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Kelas</TableHead>
                      <TableHead>Nama Kelas</TableHead>
                      <TableHead>Kode Mapel</TableHead>
                      <TableHead>Nama Mapel</TableHead>
                      <TableHead>Tahun Akademik</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Penugasan</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappingsData?.data?.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell className="font-mono text-sm">
                          {mapping.class.code}
                        </TableCell>
                        <TableCell>{mapping.class.name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {mapping.subject.code}
                        </TableCell>
                        <TableCell>{mapping.subject.name}</TableCell>
                        <TableCell>{mapping.academic_year.code}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              mapping.is_active ? "default" : "secondary"
                            }
                          >
                            {mapping.is_active ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(mapping.assigned_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMapping(mapping);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                currentPage={mappingsData?.meta?.page || page}
                totalPages={totalPages}
                totalItems={mappingsData?.meta?.total || 0}
                pageSize={pageSize}
                itemLabel="mapel kelas"
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" />
              Tambah Mapel ke Kelas
            </DialogTitle>
            <DialogDescription>
              Lengkapi 3 data berikut untuk membuat relasi mapel ke kelas.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-13rem)] space-y-5 overflow-y-auto pr-1">
            <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
              Pastikan tahun akademik yang dipilih sesuai periode aktif agar jadwal dapat disusun dengan benar.
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-select">1. Pilih Kelas</Label>
              {lockedClassId ? (
                <div
                  id="class-select"
                  className="rounded-md border bg-slate-50 px-3 py-2 text-sm"
                >
                  {lockedClass
                    ? `${lockedClass.code} - ${lockedClass.name}`
                    : "Memuat kelas..."}
                </div>
              ) : (
                <Select
                  value={formData.class_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, class_id: value })
                  }
                >
                  <SelectTrigger id="class-select">
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
              )}
              <p className="text-xs text-muted-foreground">
                {lockedClassId
                  ? "Kelas dikunci dari halaman detail kelas."
                  : "Contoh: X IPA 1, XI IPS 2, XII Bahasa."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>2. Pilih Mata Pelajaran (Bisa lebih dari 1)</Label>
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
                {subjectsData?.data?.map((subject) => {
                  const value = subject.id.toString();
                  const checked = formData.subject_ids.includes(value);

                  return (
                    <label
                      key={subject.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={!formData.class_id}
                        onCheckedChange={(isChecked) => {
                          setFormData((prev) => ({
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
                Pilih kelas terlebih dahulu, lalu centang satu atau beberapa mapel.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year-select">3. Pilih Tahun Akademik</Label>
              <Select
                value={effectiveAcademicYearId}
                onValueChange={(value) =>
                  setFormData({ ...formData, academic_year_id: value })
                }
              >
                <SelectTrigger id="year-select">
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

            <Separator />

            <div className="space-y-2 rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-700">Ringkasan Pilihan</p>
              <p>
                <span className="font-semibold">Kelas:</span>{" "}
                {selectedClass
                  ? `${selectedClass.code} - ${selectedClass.name}`
                  : "Belum dipilih"}
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
                {selectedAcademicYear?.code ?? "Belum dipilih"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetCreateForm();
              }}
            >
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={!isCreateFormValid}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Simpan {formData.subject_ids.length > 0 ? `${formData.subject_ids.length} Relasi` : "Relasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Hapus Mapel dari Kelas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Apakah Anda yakin ingin menghapus mapel ini dari kelas?
              </AlertDescription>
            </Alert>

            {selectedMapping && (
              <div className="space-y-2 rounded-md bg-gray-50 p-4 text-sm">
                <p>
                  <span className="font-semibold">Kelas:</span>{" "}
                  {selectedMapping.class.code} - {selectedMapping.class.name}
                </p>
                <p>
                  <span className="font-semibold">Mapel:</span>{" "}
                  {selectedMapping.subject.code} - {selectedMapping.subject.name}
                </p>
                <p>
                  <span className="font-semibold">Tahun:</span>{" "}
                  {selectedMapping.academic_year.code}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedMapping(null);
              }}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleRevoke}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
