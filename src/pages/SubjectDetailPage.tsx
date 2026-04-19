import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { subjectService } from "@/services/subjectService";
import type { SubjectDetail } from "@/types";
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
  ArrowLeft,
  Loader2,
  Hash,
  BookOpen,
  FileText,
} from "lucide-react";

export default function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadSubject(Number(id));
  }, [id]);

  async function loadSubject(subjectId: number) {
    setIsLoading(true);
    try {
      const res = await subjectService.getById(subjectId);
      setSubject(res.data);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Gagal memuat data mata pelajaran";
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

  if (!subject) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/mapel">
            <ArrowLeft className="mr-2 size-4" />
            Kembali
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BookOpen className="mb-2 size-8 opacity-50" />
            <p className="text-sm">Mata pelajaran tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-100/80 bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-200/35 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
              <Link to="/mapel">
                <ArrowLeft className="mr-2 size-4" />
                Kembali
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{subject.name}</h1>
            <p className="text-slate-600">Detail informasi mata pelajaran</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Kode: {subject.code}</Badge>
              <Badge variant={subject.is_active ? "default" : "secondary"}>
                {subject.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="size-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{subject.name}</CardTitle>
              <CardDescription>Kode: {subject.code}</CardDescription>
            </div>
            <Badge variant={subject.is_active ? "default" : "secondary"} className="ml-auto">
              {subject.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Informasi Dasar */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Hash className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Kode</p>
                  <p className="text-sm font-medium">{subject.code}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <BookOpen className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nama</p>
                  <p className="text-sm font-medium">{subject.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <div className="w-full">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={subject.is_active ? "default" : "secondary"}
                    className="mt-1 w-fit"
                  >
                    {subject.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            {subject.description && (
              <div className="flex items-start gap-2 rounded-lg border bg-blue-50 p-3 dark:bg-blue-950/50">
                <FileText className="mt-0.5 size-4 text-blue-500" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Deskripsi</p>
                  <p className="whitespace-pre-wrap text-sm">{subject.description}</p>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-slate-50 p-3 text-xs text-muted-foreground">
                <p className="font-medium">Dibuat</p>
                <p>{new Date(subject.created_at).toLocaleString("id-ID")}</p>
              </div>
              <div className="rounded-lg border bg-slate-50 p-3 text-xs text-muted-foreground">
                <p className="font-medium">Diperbarui</p>
                <p>{new Date(subject.updated_at).toLocaleString("id-ID")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
