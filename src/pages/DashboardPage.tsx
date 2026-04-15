import { useAuthStore } from "@/stores/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, CalendarDays } from "lucide-react";

const stats = [
  { title: "Total Siswa", value: "1.234", icon: GraduationCap, change: "+12%" },
  { title: "Total Guru", value: "56", icon: Users, change: "+2%" },
  { title: "Mata Pelajaran", value: "24", icon: BookOpen, change: "0%" },
  { title: "Kelas Aktif", value: "36", icon: CalendarDays, change: "+3%" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang kembali, {user?.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.title}</CardDescription>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {stat.change} dari bulan lalu
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
