import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { healthService } from "@/services/healthService";
import type { HealthData } from "@/types";
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
  Activity,
  Clock,
  RefreshCw,
  Server,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}j`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}d`);
  return parts.join(" ");
}

export default function HealthStatusPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  async function checkHealth() {
    setStatus("loading");
    try {
      const res = await healthService.check();
      setData(res.data);
      setStatus("ok");
      setLastChecked(new Date().toLocaleTimeString("id-ID"));
      toast.success("Server berjalan normal");
    } catch (err) {
      setStatus("error");
      setLastChecked(new Date().toLocaleTimeString("id-ID"));
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Server tidak dapat dijangkau";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Status Server</h1>
          <p className="text-muted-foreground">
            Periksa kondisi dan kesehatan server API
          </p>
        </div>
        <Button onClick={checkHealth} disabled={status === "loading"}>
          {status === "loading" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Periksa Server
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Status</CardDescription>
            <Server className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {status === "idle" && (
              <p className="text-sm text-muted-foreground">
                Belum diperiksa
              </p>
            )}
            {status === "loading" && (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Memeriksa...</span>
              </div>
            )}
            {status === "ok" && (
              <div className="flex items-center gap-2">
                <Badge className="gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20">
                  <CheckCircle2 className="size-3" />
                  Online
                </Badge>
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="size-3" />
                  Offline
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Uptime Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Uptime</CardDescription>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <CardTitle className="text-2xl">
                {formatUptime(data.uptime)}
              </CardTitle>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>

        {/* Last Checked Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Terakhir Diperiksa</CardDescription>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {lastChecked ? (
              <CardTitle className="text-2xl">{lastChecked}</CardTitle>
            ) : (
              <p className="text-sm text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Server</CardTitle>
            <CardDescription>
              Informasi detail dari health check terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Timestamp</dt>
                <dd className="font-mono text-sm">
                  {new Date(data.timestamp).toLocaleString("id-ID")}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  Uptime (detik)
                </dt>
                <dd className="font-mono text-sm">
                  {data.uptime.toFixed(2)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
