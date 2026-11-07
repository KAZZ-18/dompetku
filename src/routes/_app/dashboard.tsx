import { Suspense, useState, useEffect } from "react";
import {
  DonutChart,
  CashflowAreaChart,
  NetWorthChart,
  CategoryLineChart,
} from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Menu,
  Calendar,
  ChevronDown,
  Bell,
  Settings,
  LogOut,
  User,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Target,
  CreditCard,
  Banknote,
  Coins,
  Trophy,
} from "lucide-react";
import { money, compact } from "@/lib/format";
import { dateLabel, monthLabel, shortMonth } from "@/lib/dates";
import { walletLabel } from "@/lib/permissions";
import { useI18n } from "@/lib/i18n";
import { getDashboard } from "@/lib/finance.functions";
import { logout } from "@/lib/auth.functions";
import { TransactionDialog, newTxDraft } from "@/components/transaction-dialog";
import { monthChange, formatPercent } from "@/lib/ratio";
import { usePrivacy } from "@/lib/privacy";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const PIE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function SkeletonKPI() {
  return (
    <Card className="animate-pulse">
      <CardContent className="pt-6">
        <div className="h-4 bg-muted rounded w-3/4 mb-4" />
        <div className="h-8 bg-muted rounded w-1/2" />
      </CardContent>
    </Card>
  );
}

function SkeletonChart() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-5 bg-muted rounded w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] bg-muted rounded" />
      </CardContent>
    </Card>
  );
}

function SkeletonTable() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-5 bg-muted rounded w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 h-12">
              <div className="h-12 w-12 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonDonut() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-5 bg-muted rounded w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 h-[320px]">
          <div className="relative w-full max-w-xs">
            <div className="aspect-square w-full max-w-xs mx-auto bg-muted rounded-full" />
          </div>
          <div className="w-full space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-2">
                <div className="flex items-center gap-3">
                  <div className="size-3 bg-muted rounded-full" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
                <div className="text-right">
                  <div className="h-5 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-16 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonReminders() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-5 bg-muted rounded w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="size-10 shrink-0 bg-muted rounded-lg" />
                <div className="min-w-0">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2 mt-1" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-5 bg-muted rounded w-24" />
                <div className="h-4 bg-muted rounded w-16 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonBudgets() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-5 bg-muted rounded w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="size-3 bg-muted rounded-full" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
                <div className="h-5 bg-muted rounded w-20 text-right" />
              </div>
              <div className="h-2 bg-muted rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonAccounts() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-5 bg-muted rounded w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3">
                <div className="size-10 shrink-0 bg-muted rounded-lg" />
                <div>
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4 mt-1" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-6 bg-muted rounded w-24 font-mono" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonGoals() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-5 bg-muted rounded w-1/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="size-3 bg-muted rounded-full" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
                <div className="h-5 bg-muted rounded w-20 text-right" />
              </div>
              <div className="h-2 bg-muted rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AnimatedNetWorthChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          }}
          labelStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
          itemStyle={{ fontSize: 12 }}
          formatter={(value: number) => [money(value), ""]}
        />
        <Legend wrapperStyle={{ paddingTop: 10 }} iconSize={8} iconType="circle" />
        <Line
          type="monotone"
          dataKey="netWorth"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
          name="Nilai Bersih"
        />
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke="#16a34a"
          fillOpacity={1}
          fill="url(#netWorthGradient)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [d, setD] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dlg, setDlg] = useState<{ open: boolean; draft: ReturnType<typeof newTxDraft> }>({
    open: false,
    draft: newTxDraft("income"),
  });

  const isAdmin = true;
  const { t } = useI18n();

  const getDashboardFn = useServerFn(getDashboard);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getDashboardFn({ data: { month } });
        if (mounted) {
          setD(res);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Gagal memuat data");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [month, getDashboardFn]);

  if (isLoading) {
    return (
      <TooltipProvider>
        <div className="lg:pl-72 flex flex-col min-h-screen bg-background">
          <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Buka menu"
              >
                <Menu className="size-5" />
              </Button>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-bold">{t("Dashboard")}</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6 overflow-x-auto">
            <div className="max-w-[1400px] mx-auto space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 200 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("Selamat datang kembali")}, Admin 👋
                  </p>
                  <h2 className="font-display text-2xl lg:text-3xl font-bold mt-1">
                    {t("Ringkasan Keuangan Bulan Ini")}
                  </h2>
                </div>
                <Button className="gap-2" disabled>
                  <Plus className="size-4" />
                  <span>{t("Tambah Transaksi")}</span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 200, delay: 50 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <SkeletonKPI />
                <SkeletonKPI />
                <SkeletonKPI />
                <SkeletonKPI />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 200, delay: 100 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
              >
                <ChartCard title={t("Arus Kas 6 Bulan")} subtitle={t("6 bulan terakhir")}>
                  <div className="h-[560px] short:h-[420px]">
                    <SkeletonChart />
                  </div>
                </ChartCard>
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 150 }}
                  >
                    <SkeletonDonut />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 200 }}
                  >
                    <SkeletonChart />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 250 }}
                  >
                    <SkeletonTable />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 300 }}
                  >
                    <SkeletonReminders />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 350 }}
                  >
                    <SkeletonBudgets />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 400 }}
                  >
                    <SkeletonAccounts />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 450 }}
                  >
                    <SkeletonGoals />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </main>
        </div>
      </TooltipProvider>
    );
  }

  if (error) {
    return (
      <TooltipProvider>
        <div className="lg:pl-72 flex flex-col min-h-screen bg-background">
          <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Buka menu"
              >
                <Menu className="size-5" />
              </Button>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-bold">{t("Dashboard")}</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6 overflow-x-auto">
            <div className="max-w-[1400px] mx-auto space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 200 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("Selamat datang kembali")}, Admin 👋
                  </p>
                  <h2 className="font-display text-2xl lg:text-3xl font-bold mt-1">
                    {t("Ringkasan Keuangan Bulan Ini")}
                  </h2>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => setDlg({ open: true, draft: newTxDraft("income") })}
                >
                  <Plus className="size-4" />
                  <span>{t("Tambah Transaksi")}</span>
                </Button>
              </motion.div>
              <Card className="border-destructive/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <AlertTriangle className="size-6 text-destructive shrink-0" />
                    <div>
                      <p className="font-medium text-destructive">{t("Gagal memuat dashboard")}</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() =>
                        queryClient.invalidateQueries({ queryKey: ["dashboard", month] })
                      }
                    >
                      <ArrowRight className="size-4 mr-2" />
                      {t("Coba lagi")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </TooltipProvider>
    );
  }

  const netIncome = (d?.income ?? 0) - (d?.expense ?? 0);
  const totalExpenses = d?.expense ?? 0;
  const totalBalance = d?.accounts?.reduce((sum: number, a: any) => sum + (a.balance ?? 0), 0) ?? 0;
  const totalInvestments =
    d?.investments?.reduce((sum: number, inv: any) => sum + (inv.current_value ?? 0), 0) ?? 0;
  const savingsRatePct = d?.income ? (netIncome / d.income) * 100 : 0;
  const prev = d?.previousMonth;

  return (
    <TooltipProvider>
      <div className="lg:pl-72 flex flex-col min-h-screen bg-background">
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: sidebarOpen ? 0 : -300, opacity: sidebarOpen ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:opacity-100 ${sidebarOpen ? "translate-x-0 opacity-100" : "translate-x-[-300px] opacity-0 pointer-events-none"}`}
          aria-label="Navigasi sidebar"
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 font-display text-xl font-bold"
              onClick={() => setSidebarOpen(false)}
            >
              <img
                src="/logo.svg"
                alt=""
                aria-hidden="true"
                width="28"
                height="28"
                className="shrink-0 rounded-[22%] object-contain size-7"
              />
              <span className="truncate">
                Dompetku<span className="text-primary">.</span>
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x size-5"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </Button>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Menu utama">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              onClick={() => setSidebarOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-layout-dashboard size-5"
              >
                <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                <rect width="7" height="9" x="14" y="14" rx="1"></rect>
                <rect width="7" height="5" x="3" y="16" rx="1"></rect>
              </svg>
              {t("Dashboard")}
            </Link>
            <Link
              to="/transactions"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              onClick={() => setSidebarOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-list size-5"
              >
                <path d="M3 12h18"></path>
                <path d="M3 6h18"></path>
                <path d="M3 18h18"></path>
              </svg>
              {t("Transaksi")}
            </Link>
            <Link
              to="/reports"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              onClick={() => setSidebarOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-bar-chart-2 size-5"
              >
                <path d="M18 20V10"></path>
                <path d="M12 20V4"></path>
                <path d="M6 20v-6"></path>
              </svg>
              {t("Laporan")}
            </Link>
            <Link
              to="/budgets"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              onClick={() => setSidebarOpen(false)}
            >
              <Target className="size-5" />
              {t("Anggaran")}
            </Link>
            <Link
              to="/reminders"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              onClick={() => setSidebarOpen(false)}
            >
              <Bell className="size-5" />
              {t("Pengingat")}
            </Link>
            <Link
              to="/accounts"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              onClick={() => setSidebarOpen(false)}
            >
              <CreditCard className="size-5" />
              {t("Rekening")}
            </Link>
            <Link
              to="/investments"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              onClick={() => setSidebarOpen(false)}
            >
              <Coins className="size-5" />
              {t("Investasi")}
            </Link>
            <Link
              to="/goals"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              onClick={() => setSidebarOpen(false)}
            >
              <Trophy className="size-5" />
              {t("Target Tabungan")}
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
              onClick={() => setSidebarOpen(false)}
            >
              <Settings className="size-5" />
              {t("Pengaturan")}
            </Link>
          </nav>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Avatar className="size-10">
                <AvatarImage src="/logo.svg" alt="" />
                <AvatarFallback className="bg-primary text-primary-foreground font-display font-bold">
                  DK
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{isAdmin ? "Admin" : "Member"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {isAdmin ? t("Akses penuh") : t("Akses terbatas")}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="flex-1 justify-start gap-2 px-3"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="size-4" />
                <span className="text-sm">{t("Pengaturan")}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex-1 justify-start gap-2 px-3"
                onClick={async () => {
                  await logout();
                  window.location.href = "/login";
                }}
              >
                <LogOut className="size-4" />
                <span className="text-sm">{t("Keluar")}</span>
              </Button>
            </div>
          </div>
        </motion.aside>

        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="lg:pl-72 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Buka menu"
              >
                <Menu className="size-5" />
              </Button>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-bold">{t("Dashboard")}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 border border-border">
                <Calendar className="size-4 text-muted-foreground" />
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium focus-visible:outline-none cursor-pointer appearance-none text-foreground w-auto"
                  aria-label={t("Pilih bulan")}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = `2025-${String(i + 1).padStart(2, "0")}`;
                    return (
                      <option key={m} value={m}>
                        {monthLabel(m, "id-ID")}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="size-5" />
                    {d?.reminders?.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                        {d.reminders.length > 9 ? "9+" : d.reminders.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="w-80 p-0">
                  <div className="p-3 border-b border-border">
                    <p className="font-semibold">{t("Pengingat")}</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {d?.reminders?.length ? (
                      d.reminders.map((r: any) => (
                        <div
                          key={r.type + r.id}
                          className="px-3 py-2 hover:bg-muted border-b border-border/50 last:border-0"
                        >
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.type === "budget"
                              ? t("Peringatan budget")
                              : r.overdue
                                ? `${t("Terlambat")} ${-r.days_left} ${t("hari")}`
                                : r.days_left === 0
                                  ? t("Hari ini")
                                  : `${r.days_left} ${t("hari lagi")} · ${dateLabel(r.due_date, "id-ID")}`}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        {t("Tidak ada tagihan 14 hari ke depan.")}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/logo.svg" alt="" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {isAdmin ? "A" : "M"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-56 p-1">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="font-medium truncate">{isAdmin ? "Admin" : "Member"}</p>
                    <p className="text-xs text-muted-foreground truncate">{t("Dompetku")}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start gap-2 px-3 py-2">
                        <Settings className="size-4" />
                        <span>{t("Pengaturan")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link to="/settings" onClick={() => setSidebarOpen(false)}>
                          <Settings className="size-4 mr-2" />
                          {t("Pengaturan Aplikasi")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile" onClick={() => setSidebarOpen(false)}>
                          <User className="size-4 mr-2" />
                          {t("Profil")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await logout();
                          window.location.href = "/login";
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <LogOut className="size-4 mr-2" />
                        {t("Keluar")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6 overflow-x-auto">
            <div className="max-w-[1400px] mx-auto space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 200 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("Selamat datang kembali")}, {isAdmin ? "Admin" : "User"} 👋
                  </p>
                  <h2 className="font-display text-2xl lg:text-3xl font-bold mt-1">
                    {t("Ringkasan Keuangan Bulan Ini")}
                  </h2>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => setDlg({ open: true, draft: newTxDraft("income") })}
                >
                  <Plus className="size-4" />
                  <span>{t("Tambah Transaksi")}</span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 200, delay: 50 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <KPICard
                  title={t("Pendapatan Bersih")}
                  value={money(netIncome)}
                  icon={<TrendingUp className="size-5" />}
                  trend={
                    prev?.income !== undefined
                      ? { current: d.income, previous: prev.income, goodWhenUp: true }
                      : null
                  }
                  color="income"
                />
                <KPICard
                  title={t("Total Pengeluaran")}
                  value={money(totalExpenses)}
                  icon={<TrendingDown className="size-5" />}
                  trend={
                    prev?.expense !== undefined
                      ? { current: d.expense, previous: prev.expense, goodWhenUp: false }
                      : null
                  }
                  color="expense"
                />
                <KPICard
                  title={t("Rasio Tabungan")}
                  value={`${savingsRatePct.toFixed(1)}%`}
                  icon={<PiggyBank className="size-5" />}
                  color={
                    savingsRatePct >= 20 ? "income" : savingsRatePct >= 0 ? "warning" : "expense"
                  }
                />
                <KPICard
                  title={isAdmin ? t("Investasi") : t("Saldo Total")}
                  value={money(isAdmin ? totalInvestments : totalBalance)}
                  icon={<Wallet className="size-5" />}
                  color="primary"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 200, delay: 100 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
              >
                <ChartCard
                  title={t("Arus Kas 6 Bulan")}
                  subtitle={t("6 bulan terakhir")}
                  action={
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger className="w-[160px] bg-muted border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => {
                          const m = `2025-${String(i + 1).padStart(2, "0")}`;
                          return (
                            <SelectItem key={m} value={m}>
                              {monthLabel(m, "id-ID")}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  }
                >
                  <div className="h-[560px] short:h-[420px]">
                    <CashflowAreaChart
                      data={
                        d?.trend?.map((t: any) => ({
                          ...t,
                          label: shortMonth(t.month, "id-ID"),
                        })) ?? []
                      }
                      incomeLabel={t("Pemasukan")}
                      expenseLabel={t("Pengeluaran")}
                    />
                  </div>
                </ChartCard>

                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 150 }}
                  >
                    <ChartCard title={t("Pengeluaran per Kategori")} subtitle={t("Bulan ini")}>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative w-full max-w-xs">
                          <DonutChart
                            data={
                              d?.byCategory?.map((c: any, i: number) => ({
                                name: c.name,
                                value: c.value,
                                color: c.color ?? PIE[i % PIE.length],
                              })) ?? []
                            }
                            innerRadius={50}
                            outerRadius={80}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <p className="font-display text-2xl font-bold tabular-nums">
                                {money(d?.expense ?? 0)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {t("Total Pengeluaran")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="w-full space-y-2">
                          {d?.byCategory?.slice(0, 6).map((c: any, i: number) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 150, delay: i * 30 }}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted transition-colors duration-150"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span
                                  className="size-3 shrink-0 rounded-full"
                                  style={{ background: c.color ?? PIE[i % PIE.length] }}
                                />
                                <span className="truncate text-sm font-medium">{c.name}</span>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-mono tabular-nums font-medium text-sm">
                                  {money(c.value)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {d?.expense > 0
                                    ? `${((c.value / d.expense) * 100).toFixed(1)}%`
                                    : "0%"}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </ChartCard>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 200 }}
                  >
                    <ChartCard
                      title={t("Nilai Bersih")}
                      subtitle={t("Tren 6 bulan")}
                      action={
                        <Link to="/reports" className="text-xs text-primary hover:underline">
                          {t("Lihat detail")}
                        </Link>
                      }
                    >
                      <div className="h-[280px]">
                        <AnimatedNetWorthChart
                          data={
                            d?.netWorthTrend?.map((t: any) => ({
                              ...t,
                              label: shortMonth(t.month, "id-ID"),
                            })) ?? []
                          }
                        />
                      </div>
                    </ChartCard>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 250 }}
                  >
                    <ChartCard
                      title={t("Transaksi Terbaru")}
                      subtitle={t("10 transaksi terakhir")}
                      action={
                        <Link to="/transactions" className="text-xs text-primary hover:underline">
                          {t("Lihat semua")}
                        </Link>
                      }
                    >
                      <ScrollArea className="h-[380px] short:h-[320px]">
                        {d?.recent?.length ? (
                          <table className="w-full text-sm" role="table">
                            <thead>
                              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <th className="pb-3 pr-4">{t("Merchant")}</th>
                                <th className="pb-3 pr-4 text-center">{t("Tanggal")}</th>
                                <th className="pb-3 pr-4 text-center">{t("Akun")}</th>
                                <th className="pb-3 pr-4 text-center">{t("Tipe")}</th>
                                <th className="pb-3 pr-4 text-right">{t("Jumlah")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                              {d.recent.map((tx: any, i: number) => (
                                <motion.tr
                                  key={tx.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 150, delay: i * 20 }}
                                  className="hover:bg-muted transition-colors duration-150"
                                >
                                  <td className="py-3 pr-4">
                                    <div className="flex items-center gap-3">
                                      <div className="size-9 shrink-0 rounded-lg bg-card flex items-center justify-center border border-border">
                                        {tx.category ? (
                                          <span
                                            className="size-2.5 rounded-full"
                                            style={{ background: tx.category.color }}
                                          />
                                        ) : (
                                          <DollarSign className="size-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium truncate max-w-[200px]">
                                          {tx.description ||
                                            tx.merchant ||
                                            tx.category?.name ||
                                            "Transaksi"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {tx.category?.name || "-"}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 pr-4 text-center text-xs text-muted-foreground">
                                    {dateLabel(tx.occurred_at, "id-ID")}
                                  </td>
                                  <td className="py-3 pr-4 text-center text-xs">
                                    {tx.account ? walletLabel(tx.account, t) : "-"}
                                  </td>
                                  <td className="py-3 pr-4 text-center">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${tx.kind === "income" ? "bg-green-500/10 text-green-500" : tx.kind === "expense" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}
                                    >
                                      {tx.kind === "income" && <ArrowUpRight className="size-3" />}
                                      {tx.kind === "expense" && (
                                        <ArrowDownRight className="size-3" />
                                      )}
                                      {tx.kind === "transfer" && <ArrowRight className="size-3" />}
                                      {t(
                                        tx.kind === "income"
                                          ? "Masuk"
                                          : tx.kind === "expense"
                                            ? "Keluar"
                                            : "Transfer",
                                      )}
                                    </span>
                                  </td>
                                  <td className="py-3 pr-4 text-right font-mono tabular-nums font-medium">
                                    <span
                                      className={
                                        tx.kind === "income"
                                          ? "text-green-500"
                                          : tx.kind === "expense"
                                            ? "text-red-500"
                                            : "text-primary"
                                      }
                                    >
                                      {tx.kind === "income"
                                        ? "+"
                                        : tx.kind === "expense"
                                          ? "−"
                                          : ""}
                                      {money(tx.amount, tx.currency)}
                                    </span>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-12 text-center text-sm text-muted-foreground"
                          >
                            {t("Belum ada transaksi. Mulai catat sekarang!")}
                          </motion.div>
                        )}
                      </ScrollArea>
                    </ChartCard>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 300 }}
                  >
                    <ChartCard
                      title={t("Pengingat")}
                      subtitle={t("14 hari ke depan")}
                      action={
                        <Link to="/reminders" className="text-xs text-primary hover:underline">
                          {t("Lihat semua")}
                        </Link>
                      }
                    >
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {d?.reminders?.length ? (
                          d.reminders.map((r: any, i: number) => (
                            <motion.div
                              key={r.type + r.id}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 150, delay: i * 30 }}
                              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted border border-border hover:border-primary/50 transition-colors duration-150"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="size-10 shrink-0 rounded-lg bg-card flex items-center justify-center border border-border">
                                  <AlertTriangle className="size-5 text-destructive" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{r.title}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    {r.type === "budget"
                                      ? t("Peringatan budget")
                                      : r.overdue
                                        ? `${t("Terlambat")} ${-r.days_left} ${t("hari")}`
                                        : r.days_left === 0
                                          ? t("Hari ini")
                                          : `${r.days_left} ${t("hari lagi")} · ${dateLabel(r.due_date, "id-ID")}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono tabular-nums font-medium text-destructive">
                                  {money(r.amount, r.currency)}
                                </p>
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded ${r.overdue ? "bg-destructive/10 text-destructive" : r.days_left <= 3 ? "bg-warning/10 text-warning" : "bg-muted-foreground/10 text-muted-foreground"}`}
                                >
                                  {r.overdue
                                    ? t("Terlambat")
                                    : r.days_left <= 3
                                      ? t("Segera")
                                      : t("Dijadwalkan")}
                                </span>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-8 text-center text-sm text-muted-foreground"
                          >
                            {t("Tidak ada tagihan 14 hari ke depan.")}
                          </motion.div>
                        )}
                      </div>
                    </ChartCard>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 350 }}
                  >
                    <ChartCard
                      title={t("Anggaran Bulan Ini")}
                      subtitle={t("Kemajuan real-time")}
                      action={
                        <Link to="/budgets" className="text-xs text-primary hover:underline">
                          {t("Kelola")}
                        </Link>
                      }
                    >
                      <div className="space-y-3">
                        {d?.budgets?.length ? (
                          d.budgets.map((b: any, i: number) => (
                            <motion.div
                              key={b.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 150, delay: i * 30 }}
                              className="p-3"
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-3 shrink-0 rounded-full"
                                    style={{ background: b.category?.color ?? PIE[i % PIE.length] }}
                                  />
                                  <span className="font-medium truncate max-w-[140px]">
                                    {b.category?.name ?? t("Anggaran")}
                                  </span>
                                </div>
                                <span className="font-mono tabular-nums text-sm font-medium text-right shrink-0">
                                  {money(b.spent ?? 0)} / {money(b.limit ?? 0)}
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${Math.min(100, ((b.spent ?? 0) / (b.limit ?? 1)) * 100)}%`,
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 20,
                                    delay: 0.1,
                                  }}
                                  className={`h-full rounded-full transition-colors duration-300 ${(b.spent ?? 0) >= (b.limit ?? 0) ? "bg-destructive" : (b.spent ?? 0) >= (b.limit ?? 0) * 0.8 ? "bg-warning" : "bg-primary"}`}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 text-right">
                                {(((b.spent ?? 0) / (b.limit ?? 1)) * 100).toFixed(0)}%{" "}
                                {t("terpakai")}
                              </p>
                            </motion.div>
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-8 text-center text-sm text-muted-foreground"
                          >
                            {t("Belum ada budget. Buat yang pertama!")}
                          </motion.div>
                        )}
                      </div>
                    </ChartCard>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 400 }}
                  >
                    <ChartCard
                      title={t("Saldo Rekening")}
                      subtitle={t("Semua akun")}
                      action={
                        <Link to="/accounts" className="text-xs text-primary hover:underline">
                          {t("Kelola")}
                        </Link>
                      }
                    >
                      <div className="space-y-2">
                        {d?.accounts?.length ? (
                          d.accounts.map((a: any, i: number) => (
                            <motion.div
                              key={a.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 150, delay: i * 30 }}
                              className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted transition-colors duration-150"
                            >
                              <div className="flex items-center gap-3">
                                <div className="size-10 shrink-0 rounded-lg bg-card flex items-center justify-center border border-border">
                                  {a.icon ? (
                                    <img src={a.icon} alt="" className="size-5" />
                                  ) : a.type === "cash" ? (
                                    <Banknote className="size-5 text-muted-foreground" />
                                  ) : a.type === "bank" ? (
                                    <CreditCard className="size-5 text-muted-foreground" />
                                  ) : (
                                    <Coins className="size-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{a.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {a.type}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-mono tabular-nums font-medium">
                                  {money(a.balance ?? 0, a.currency)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {a.type === "investment"
                                    ? t("Investasi")
                                    : a.type === "savings"
                                      ? t("Tabungan")
                                      : t("Transaksi")}
                                </p>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-8 text-center text-sm text-muted-foreground"
                          >
                            {t("Belum ada rekening. Tambah yang pertama!")}
                          </motion.div>
                        )}
                      </div>
                    </ChartCard>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 200, delay: 450 }}
                  >
                    <ChartCard
                      title={t("Target Tabungan")}
                      subtitle={t("Kemajuan menuju tujuan")}
                      action={
                        <Link to="/goals" className="text-xs text-primary hover:underline">
                          {t("Kelola")}
                        </Link>
                      }
                    >
                      <div className="space-y-3">
                        {d?.goals?.length ? (
                          d.goals.map((g: any, i: number) => (
                            <motion.div
                              key={g.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 150, delay: i * 30 }}
                              className="p-3"
                            >
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-3 shrink-0 rounded-full"
                                    style={{ background: g.color ?? PIE[i % PIE.length] }}
                                  />
                                  <span className="font-medium truncate max-w-[140px]">
                                    {g.name}
                                  </span>
                                </div>
                                <span className="font-mono tabular-nums text-sm font-medium text-right shrink-0">
                                  {money(g.current ?? 0)} / {money(g.target ?? 0)}
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${Math.min(100, ((g.current ?? 0) / (g.target ?? 1)) * 100)}%`,
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 20,
                                    delay: 0.1,
                                  }}
                                  className={`h-full rounded-full transition-colors duration-300 ${(g.current ?? 0) >= (g.target ?? 0) ? "bg-income" : "bg-primary"}`}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 text-right">
                                {(((g.current ?? 0) / (g.target ?? 1)) * 100).toFixed(0)}%{" "}
                                {t("tercapai")}
                                {g.target_date &&
                                  ` · ${t("Target")} ${dateLabel(g.target_date, "id-ID")}`}
                              </p>
                            </motion.div>
                          ))
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-8 text-center text-sm text-muted-foreground"
                          >
                            {t("Belum ada target tabungan. Mulai yang pertama!")}
                          </motion.div>
                        )}
                      </div>
                    </ChartCard>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </main>
        </div>

        <TransactionDialog
          open={dlg.open}
          onOpenChange={(o: boolean) => setDlg((s) => ({ ...s, open: o }))}
          initial={dlg.draft}
        />
      </div>
    </TooltipProvider>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: { current: number; previous: number | undefined; goodWhenUp: boolean } | null;
  color: "income" | "expense" | "warning" | "primary";
}

function KPICard({ title, value, icon, trend, color }: KPICardProps) {
  usePrivacy();
  const { t } = useI18n();

  const iconColors = {
    income: "text-green-500",
    expense: "text-red-500",
    warning: "text-yellow-500",
    primary: "text-primary",
  };

  return (
    <Card className="p-5 border-border hover:border-primary/50 transition-colors duration-150">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 150 }}
            className="num mt-2 break-words text-2xl lg:text-3xl font-bold text-foreground"
          >
            {value}
          </motion.p>
          {trend && trend.previous !== undefined ? (
            <MonthDelta
              current={trend.current}
              previous={trend.previous}
              goodWhenUp={trend.goodWhenUp}
            />
          ) : null}
        </div>
        <div className={`shrink-0 p-2.5 rounded-lg bg-muted ${iconColors[color]}`}>{icon}</div>
      </div>
    </Card>
  );
}

function MonthDelta({
  current,
  previous,
  goodWhenUp,
}: {
  current: number;
  previous: number | undefined;
  goodWhenUp: boolean;
}) {
  const { t } = useI18n();
  const pct = monthChange(current, previous);
  if (pct === null)
    return <p className="mt-2 text-xs text-muted-foreground">{t("Belum ada data bulan lalu")}</p>;
  const flat = Math.round(pct) === 0;
  const up = pct > 0;
  const isGood = flat ? null : up === goodWhenUp;
  const tone = flat ? "text-muted-foreground" : isGood ? "text-green-500" : "text-red-500";
  return (
    <motion.p initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
      <span className={`num font-medium text-xs ${tone}`}>
        <span aria-hidden="true">{flat ? "➤" : up ? "▲" : "▼"}</span>
        <span className="sr-only">{flat ? t("Tetap") : up ? t("Naik") : t("Turun")}</span>{" "}
        {formatPercent(Math.abs(pct))}
      </span>{" "}
      <span className="text-xs text-muted-foreground">{t("vs bulan lalu")}</span>
    </motion.p>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function ChartCard({ title, subtitle, action, children }: ChartCardProps) {
  return (
    <Card className="p-5 border-border">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </Card>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}
