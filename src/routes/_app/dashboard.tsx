import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
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
  X,
  Home,
  Search,
  ScanLine,
  BarChart2,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  ExternalLink,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  HelpCircle,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Globe,
  Layers,
  Download,
  Upload,
  Share2,
  FileText,
  Zap,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { RouteError } from "@/components/route-error";
import { PENDING_MS, DashboardSkeleton } from "@/components/skeletons";
import { TransactionDialog, newTxDraft } from "@/components/transaction-dialog";
import { ReceiptScanner } from "@/components/receipt-scanner";
import { useIsDemo } from "@/components/demo";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Segmented } from "@/components/segmented";
import { money, compact } from "@/lib/format";
import { dateLabel, monthLabel, shortMonth } from "@/lib/dates";
import { walletLabel } from "@/lib/permissions";
import { useI18n } from "@/lib/i18n";
import { usePrivacy } from "@/lib/privacy";
import { useAccess } from "@/hooks/use-access";
import { getDashboard } from "@/lib/finance.functions";
import { logout } from "@/lib/auth.functions";
import { dashboardQuery, netWorthQuery } from "@/lib/queries";
import { savingsRate, previousOf, monthChange, formatPercent } from "@/lib/ratio";
import { pageHead } from "@/lib/head";
import { currentMonth } from "@/lib/dates";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import {
  DonutChart,
  CashflowAreaChart,
  NetWorthChart as ChartNetWorthChart,
  CategoryLineChart,
} from "@/components/charts";

const PIE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
  { key: "transactions", label: "Transaksi", icon: DollarSign, path: "/transactions" },
  { key: "reports", label: "Laporan", icon: BarChart2, path: "/reports" },
  { key: "annual-recap", label: "Rekap Tahunan", icon: FileText, path: "/rekap" },
  { key: "accounts", label: "Akun", icon: Wallet, path: "/accounts" },
  { key: "debts", label: "Hutang & Cicilan", icon: CreditCard, path: "/debts" },
  { key: "subscriptions", label: "Langganan", icon: Zap, path: "/subscriptions" },
  { key: "recurring", label: "Transaksi Berulang", icon: RefreshCw, path: "/recurring" },
  { key: "budgets", label: "Budget", icon: PieChart, path: "/budgets" },
  { key: "goals", label: "Target", icon: Target, path: "/goals" },
  { key: "gold", label: "Emas", icon: Trophy, path: "/gold" },
  { key: "receivables", label: "Piutang", icon: ArrowUpRight, path: "/receivables" },
  { key: "reminders", label: "Pengingat", icon: Bell, path: "/reminders" },
  { key: "settings", label: "Pengaturan", icon: Settings, path: "/settings" },
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

function AnimatedNetWorthChart({ data }: { data: unknown[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#55C99A" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#55C99A" stopOpacity={0} />
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
          stroke="#55C99A"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
          name="Nilai Bersih"
        />
        <Area
          type="monotone"
          dataKey="netWorth"
          stroke="#55C99A"
          fillOpacity={1}
          fill="url(#netWorthGradient)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: { current: number; previous: number | undefined; goodWhenUp: boolean } | null;
  color: "income" | "expense" | "warning" | "primary" | "balance";
  subtitle?: string | undefined;
}

function KPICard({ title, value, icon, trend, color, subtitle }: KPICardProps) {
  usePrivacy();
  const { t } = useI18n();

  const iconColors = {
    income: "bg-income/10 text-income",
    expense: "bg-expense/10 text-expense",
    warning: "bg-warning/10 text-warning",
    primary: "bg-primary/10 text-primary",
    balance: "bg-primary/10 text-primary",
  };

  const iconBgColors = {
    income: "bg-income/20",
    expense: "bg-expense/20",
    warning: "bg-warning/20",
    primary: "bg-primary/20",
    balance: "bg-primary/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group"
    >
      <Card className="p-5 border-border hover:border-primary/30 transition-colors duration-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground/70 mb-2">{subtitle}</p>}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="num text-2xl lg:text-3xl font-bold text-foreground break-words"
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
          <div className={`shrink-0 p-3 rounded-xl ${iconBgColors[color]} ${iconColors[color]}`}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
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
  const tone = flat ? "text-muted-foreground" : isGood ? "text-income" : "text-expense";
  return (
    <motion.p initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
      <span className={`num font-medium text-xs ${tone} flex items-center gap-1`}>
        <span aria-hidden="true">{flat ? "→" : up ? "↑" : "↓"}</span>
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
  className?: string;
}

function ChartCard({ title, subtitle, action, children, className }: ChartCardProps) {
  return (
    <Card className={`p-5 border-border ${className || ""}`}>
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

function Dashboard() {
  const queryClient = useQueryClient();
  const { t, lang } = useI18n();
  const locale = lang === "en" ? "en-US" : "id-ID";
  const [month, setMonth] = useState(() => currentMonth());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { data: d } = useQuery({ ...dashboardQuery(month), placeholderData: (p) => p });
  const { data: nw } = useQuery(netWorthQuery(12, month));
  const { isAdmin, access } = useAccess();
  const canWrite = isAdmin || Object.values(access.grants).includes("manage");
  const [dlg, setDlg] = useState<{ open: boolean; draft: ReturnType<typeof newTxDraft> }>({
    open: false,
    draft: newTxDraft("income"),
  });
  const logoutFn = useServerFn(logout);
  const isDemo = useIsDemo();

  if (!d) return <DashboardSkeleton />;

  const prev = previousOf<{ income: number; expense: number }>(d.trend);
  const rate = savingsRate(d.net, d.income);

  const netIncome = d.net;
  const totalExpenses = d.expense;
  const savingsRatePct = rate !== null ? rate * 100 : 0;
  const totalInvestments = isAdmin
    ? (d.accounts
        ?.filter((a: unknown) => (a as { type: string }).type === "investment")
        .reduce((sum: number, a: unknown) => sum + ((a as { balance: number }).balance ?? 0), 0) ??
      0)
    : 0;
  const totalBalance =
    d.accounts?.reduce(
      (sum: number, a: unknown) => sum + ((a as { balance: number }).balance ?? 0),
      0,
    ) ?? 0;

  const handleLogout = async () => {
    await logoutFn();
    queryClient.clear();
  };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: sidebarOpen ? 0 : -300, opacity: sidebarOpen ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 lg:translate-x-0 lg:opacity-100 ${
            sidebarCollapsed ? "w-16" : "w-72"
          } ${sidebarOpen ? "translate-x-0 opacity-100" : "translate-x-[-300px] opacity-0 pointer-events-none lg:pointer-events-auto lg:opacity-100 lg:translate-x-0"}`}
          aria-label="Navigasi sidebar"
        >
          {/* Logo */}
          <div
            className={`flex h-16 items-center justify-between px-4 border-b border-sidebar-border ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <Link
              to="/dashboard"
              className="flex items-center gap-2 font-display text-xl font-bold text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <img
                src="/logo.svg"
                alt=""
                aria-hidden="true"
                width="32"
                height="32"
                className="shrink-0 rounded-[22%] object-contain size-8"
              />
              {!sidebarCollapsed && (
                <span className="min-w-0 truncate [&>span]:text-sidebar-accent dark:[&>span]:text-sidebar-accent">
                  Dompetku<span className="text-sidebar-primary">.</span>
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-muted-foreground hover:text-sidebar-foreground"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? "Perluas sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="size-5" />
              ) : (
                <ChevronLeft className="size-5" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === "dashboard";
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="size-5 shrink-0 flex-shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-sidebar-border p-3 space-y-2">
            <div className="flex items-center gap-2 px-3 py-2">
              {!sidebarCollapsed && (
                <span className="text-xs text-sidebar-muted-foreground">Tampilan</span>
              )}
            </div>

            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              title={sidebarCollapsed ? "Mode gelap/terang" : undefined}
            >
              <Moon className="size-5 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span>Mode gelap</span>}
            </Button>

            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              title={sidebarCollapsed ? "Bahasa" : undefined}
            >
              <Globe className="size-5 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span>{lang.toUpperCase()}</span>}
            </Button>

            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
              title={sidebarCollapsed ? "Sembunyikan angka" : undefined}
            >
              <EyeOff className="size-5 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span>Sembunyikan angka</span>}
            </Button>

            <div className="border-t border-sidebar-border pt-3" />

            {/* User Profile */}
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 ${sidebarCollapsed ? "justify-center" : ""}`}
              title={sidebarCollapsed ? "Profil" : undefined}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/logo.svg" alt="" />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && <span className="truncate">Kazzan</span>}
            </Link>

            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 px-3 py-2 rounded-xl text-sm font-medium text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 ${sidebarCollapsed ? "justify-center" : ""}`}
              onClick={handleLogout}
              title={sidebarCollapsed ? "Keluar" : undefined}
            >
              <LogOut className="size-5 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span>Keluar</span>}
            </Button>

            {!sidebarCollapsed && (
              <div className="pt-4 border-t border-sidebar-border">
                <p className="text-xs text-sidebar-muted-foreground text-center">
                  v1.8.0 · a7a9231
                </p>
                <p className="text-xs text-sidebar-primary text-center mt-1">
                  Update tersedia: v1.10.2
                </p>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Main Content */}
        <main
          className={`flex-1 flex flex-col min-h-screen lg:pl-72 ${sidebarCollapsed ? "lg:pl-16" : ""} transition-all duration-300`}
        >
          {/* Top Header */}
          <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Buka menu"
              >
                <Menu className="size-6" />
              </Button>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-bold text-foreground">Dashboard</h1>
                <p className="text-xs text-muted-foreground">Kurs hari ini: 1 USD = Rp 18.098</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" className="relative" title="Notifikasi">
                <Bell className="size-5" />
                <span className="absolute -top-1 -right-1 size-4 bg-expense text-expense-foreground rounded-full text-[10px] font-medium flex items-center justify-center">
                  3
                </span>
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="hidden sm:flex"
                title="Unduh laporan"
              >
                <Download className="size-5" />
              </Button>

              <Button variant="ghost" size="icon" className="hidden sm:flex" title="Bagikan">
                <Share2 className="size-5" />
              </Button>

              <Button variant="ghost" size="icon" className="hidden sm:flex" title="Lainnya">
                <MoreHorizontal className="size-5" />
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="gap-2 hidden sm:flex" title="Scan nota">
                    <ScanLine className="size-4" />
                    <span>Scan nota</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scan struk belanja dengan kamera</p>
                </TooltipContent>
              </Tooltip>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="default"
                    className="gap-2 bg-income text-income-foreground hover:bg-income/90 hidden sm:flex"
                  >
                    <Plus className="size-4" />
                    <span>Transaksi</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-48">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-income hover:bg-income/10"
                    onClick={() => setDlg({ open: true, draft: newTxDraft("income") })}
                  >
                    <ArrowUpRight className="size-4" />
                    Pemasukan
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-expense hover:bg-expense/10"
                    onClick={() => setDlg({ open: true, draft: newTxDraft("expense") })}
                  >
                    <ArrowDownRight className="size-4" />
                    Pengeluaran
                  </Button>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 hover:bg-muted"
                    onClick={() => setDlg({ open: true, draft: newTxDraft("transfer") })}
                  >
                    <ArrowRight className="size-4" />
                    Transfer
                  </Button>
                </PopoverContent>
              </Popover>

              {/* Mobile Actions */}
              <div className="flex lg:hidden gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" title="Scan nota">
                      <ScanLine className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Scan struk belanja</p>
                  </TooltipContent>
                </Tooltip>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="bg-income text-income-foreground"
                      title="Tambah transaksi"
                    >
                      <Plus className="size-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="end" className="w-48">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-income hover:bg-income/10"
                      onClick={() => setDlg({ open: true, draft: newTxDraft("income") })}
                    >
                      <ArrowUpRight className="size-4" />
                      Pemasukan
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-expense hover:bg-expense/10"
                      onClick={() => setDlg({ open: true, draft: newTxDraft("expense") })}
                    >
                      <ArrowDownRight className="size-4" />
                      Pengeluaran
                    </Button>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 hover:bg-muted"
                      onClick={() => setDlg({ open: true, draft: newTxDraft("transfer") })}
                    >
                      <ArrowRight className="size-4" />
                      Transfer
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Month Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <PageHeader
                  title="Ringkasan Keuangan"
                  subtitle={`Bulan ${monthLabel(month, locale)}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setMonth((m) => {
                      const [yearStr, monthStr] = m.split("-");
                      const year = Number(yearStr);
                      const monthNum = Number(monthStr);
                      return monthNum === 1
                        ? `${year - 1}-12`
                        : `${year}-${String(monthNum - 1).padStart(2, "0")}`;
                    })
                  }
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Select value={month} onValueChange={(v) => setMonth(v as `${number}-${number}`)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - i);
                      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                      return (
                        <SelectItem key={value} value={value}>
                          {monthLabel(value, locale)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setMonth((m) => {
                      const [yearStr, monthStr] = m.split("-");
                      const year = Number(yearStr);
                      const monthNum = Number(monthStr);
                      return monthNum === 12
                        ? `${year + 1}-01`
                        : `${year}-${String(monthNum + 1).padStart(2, "0")}`;
                    })
                  }
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMonth(currentMonth())}
                  aria-label="Bulan ini"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Saldo"
                value={money(totalBalance)}
                icon={<Wallet className="size-6" />}
                trend={
                  prev
                    ? {
                        current: totalBalance,
                        previous: prev.income - prev.expense,
                        goodWhenUp: true,
                      }
                    : null
                }
                color="balance"
                subtitle={`${d.accounts?.length || 0} akun aktif`}
              />
              <KPICard
                title="Pemasukan"
                value={money(d.income)}
                icon={<ArrowUpRight className="size-6" />}
                trend={prev ? { current: d.income, previous: prev.income, goodWhenUp: true } : null}
                color="income"
              />
              <KPICard
                title="Pengeluaran"
                value={money(d.expense)}
                icon={<ArrowDownRight className="size-6" />}
                trend={
                  prev ? { current: d.expense, previous: prev.expense, goodWhenUp: false } : null
                }
                color="expense"
              />
              <KPICard
                title="Selisa Bulan Ini"
                value={money(netIncome)}
                icon={<TrendingUp className="size-6" />}
                trend={
                  prev
                    ? { current: netIncome, previous: prev.income - prev.expense, goodWhenUp: true }
                    : null
                }
                color={netIncome >= 0 ? "income" : "expense"}
                subtitle={
                  d.income > 0
                    ? `${((Math.abs(netIncome) / d.income) * 100).toFixed(0)}% dari pemasukan`
                    : undefined
                }
              />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Cash Flow Chart */}
                <ChartCard
                  title="Arus Kas 6 Bulan"
                  subtitle="Pemasukan vs Pengeluaran"
                  action={
                    <Button variant="ghost" size="sm" className="gap-1">
                      <ExternalLink className="size-3" />
                      Detail
                    </Button>
                  }
                >
                  <div className="h-[380px]">
                    <CashflowAreaChart
                      data={
                        d?.trend?.map((t: unknown) => {
                          const item = t as { month: string; income: number; expense: number };
                          return { ...item, label: shortMonth(item.month, locale) };
                        }) ?? []
                      }
                      incomeLabel="Pemasukan"
                      expenseLabel="Pengeluaran"
                    />
                  </div>
                </ChartCard>

                {/* Recent Transactions */}
                <ChartCard
                  title="Transaksi Terbaru"
                  subtitle={`${d.recent?.length || 0} transaksi bulan ini`}
                  action={
                    <Link
                      to="/transactions"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Lihat semua
                      <ExternalLink className="size-3" />
                    </Link>
                  }
                >
                  {d.recent?.length ? (
                    <ScrollArea className="max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <th className="py-3 px-4">Transaksi</th>
                            <th className="py-3 px-4 text-center">Tanggal</th>
                            <th className="py-3 px-4 text-center">Akun</th>
                            <th className="py-3 px-4 text-center">Jenis</th>
                            <th className="py-3 px-4 text-right">Jumlah</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          <AnimatePresence>
                            {d.recent.map((tx: unknown, i: number) => {
                              const item = tx as {
                                id: string;
                                description?: string;
                                merchant?: string;
                                category?: { name: string; color?: string };
                                account?: {
                                  name: string;
                                  type: string;
                                  icon?: string;
                                  currency: string;
                                };
                                kind: string;
                                amount: number;
                                currency: string;
                                occurred_at: string;
                              };
                              return (
                                <motion.tr
                                  key={item.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ duration: 0.2, delay: i * 0.05 }}
                                  className="hover:bg-muted/50 transition-colors duration-150"
                                >
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="size-10 shrink-0 rounded-lg bg-card flex items-center justify-center border border-border">
                                        {item.category ? (
                                          <span
                                            className="size-3 rounded-full"
                                            style={{ background: item.category.color }}
                                          />
                                        ) : (
                                          <DollarSign className="size-5 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium truncate max-w-[200px]">
                                          {item.description ||
                                            item.merchant ||
                                            item.category?.name ||
                                            "Transaksi"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {item.category?.name || "-"}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                                    {dateLabel(item.occurred_at, locale)}
                                  </td>
                                  <td className="py-3 px-4 text-center text-xs">
                                    {item.account ? walletLabel(item.account, t) : "-"}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                        item.kind === "income"
                                          ? "bg-income/10 text-income"
                                          : item.kind === "expense"
                                            ? "bg-expense/10 text-expense"
                                            : "bg-primary/10 text-primary"
                                      }`}
                                    >
                                      {item.kind === "income" && (
                                        <ArrowUpRight className="size-3" />
                                      )}
                                      {item.kind === "expense" && (
                                        <ArrowDownRight className="size-3" />
                                      )}
                                      {item.kind === "transfer" && (
                                        <ArrowRight className="size-3" />
                                      )}
                                      {t(
                                        item.kind === "income"
                                          ? "Masuk"
                                          : item.kind === "expense"
                                            ? "Keluar"
                                            : "Transfer",
                                      )}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono tabular-nums font-medium">
                                    <span
                                      className={
                                        item.kind === "income"
                                          ? "text-income"
                                          : item.kind === "expense"
                                            ? "text-expense"
                                            : "text-primary"
                                      }
                                    >
                                      {item.kind === "income"
                                        ? "+"
                                        : item.kind === "expense"
                                          ? "−"
                                          : ""}
                                      {money(item.amount, item.currency)}
                                    </span>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </ScrollArea>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      {t("Belum ada transaksi. Mulai catat sekarang!")}
                    </motion.div>
                  )}
                </ChartCard>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Spending by Category */}
                <ChartCard
                  title="Pengeluaran per Kategori"
                  subtitle={`Total ${money(d.expense)} bulan ini`}
                >
                  <div className="flex flex-col items-center gap-4 h-[380px]">
                    <div className="relative w-full max-w-xs">
                      <DonutChart
                        data={
                          d?.byCategory?.map((c: unknown, i: number) => {
                            const item = c as { name: string; value: number; color?: string };
                            return {
                              name: item.name,
                              value: item.value,
                              color: item.color ?? PIE[i % PIE.length],
                            };
                          }) ?? []
                        }
                        innerRadius={50}
                        outerRadius={80}
                      />
                    </div>
                    <div className="w-full space-y-2">
                      {d?.byCategory?.slice(0, 6).map((c: unknown, i: number) => {
                        const item = c as { name: string; value: number; color?: string };
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: i * 0.03 }}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted transition-colors duration-150"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span
                                className="size-3 shrink-0 rounded-full"
                                style={{ background: item.color ?? PIE[i % PIE.length] }}
                              />
                              <span className="truncate text-sm font-medium">{item.name}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-mono tabular-nums font-medium text-sm">
                                {money(item.value)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {d?.expense > 0
                                  ? `${((item.value / d.expense) * 100).toFixed(1)}%`
                                  : "0%"}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </ChartCard>

                {/* Upcoming Payments */}
                <ChartCard
                  title="Tagihan Mendatang"
                  subtitle="14 hari ke depan"
                  action={
                    <Link to="/reminders" className="text-xs text-primary hover:underline">
                      {t("Lihat semua")}
                    </Link>
                  }
                >
                  <div className="max-h-[380px] overflow-y-auto pr-1">
                    {d?.reminders?.length ? (
                      d.reminders.map((r: unknown, i: number) => {
                        const item = r as {
                          type: string;
                          title: string;
                          overdue: boolean;
                          days_left: number;
                          due_date: string;
                          amount: number;
                          currency: string;
                          id: string;
                        };
                        return (
                          <motion.div
                            key={item.type + item.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15, delay: i * 0.03 }}
                            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted border border-border hover:border-primary/50 transition-colors duration-150"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="size-10 shrink-0 rounded-lg bg-card flex items-center justify-center border border-border">
                                <AlertTriangle className="size-5 text-destructive" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  {item.type === "budget"
                                    ? t("Peringatan budget")
                                    : item.overdue
                                      ? `${t("Terlambat")} ${-item.days_left} ${t("hari")}`
                                      : item.days_left === 0
                                        ? t("Hari ini")
                                        : `${item.days_left} ${t("hari lagi")} · ${dateLabel(item.due_date, locale)}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono tabular-nums font-medium text-destructive">
                                {money(item.amount, item.currency)}
                              </p>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  item.overdue
                                    ? "bg-destructive/10 text-destructive"
                                    : item.days_left <= 3
                                      ? "bg-warning/10 text-warning"
                                      : "bg-muted-foreground/10 text-muted-foreground"
                                }`}
                              >
                                {item.overdue
                                  ? t("Terlambat")
                                  : item.days_left <= 3
                                    ? t("Segera")
                                    : t("Dijadwalkan")}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })
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

                {/* Assets & Investments */}
                <ChartCard title="Aset & Investasi" subtitle="Komposisi portofolio">
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          label: "Kas & Bank",
                          value: money(totalBalance - totalInvestments),
                          icon: Banknote,
                          color: "income",
                        },
                        {
                          label: "Emas",
                          value: money(totalInvestments),
                          icon: Trophy,
                          color: "warning",
                        },
                        { label: "Piutang", value: money(0), icon: ArrowUpRight, color: "primary" },
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                          className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <item.icon
                              className={`size-5 ${item.color === "income" ? "text-income" : item.color === "warning" ? "text-warning" : "text-primary"}`}
                            />
                            <span className="text-xs font-medium text-muted-foreground">
                              {item.label}
                            </span>
                          </div>
                          <p className="font-mono tabular-nums font-semibold text-lg">
                            {item.value}
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Gold Price */}
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Harga Emas Hari Ini (per gram)</h4>
                        <Badge variant="secondary" className="text-xs">
                          Antam
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Beli</p>
                          <p className="font-mono tabular-nums font-semibold">Rp 1.300.000</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Jual</p>
                          <p className="font-mono tabular-nums font-semibold">Rp 1.250.000</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ChartCard>
              </div>
            </div>

            {/* Bottom Row - Net Worth & Category Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Net Worth Trend */}
              <ChartCard
                title="Nilai Bersih"
                subtitle="Tren 12 bulan terakhir"
                action={
                  <Select value="12m">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6m">6 Bulan</SelectItem>
                      <SelectItem value="12m">12 Bulan</SelectItem>
                      <SelectItem value="24m">24 Bulan</SelectItem>
                    </SelectContent>
                  </Select>
                }
              >
                <div className="h-[300px]">
                  <AnimatedNetWorthChart
                    data={
                      nw?.map((t: unknown) => {
                        const item = t as { month: string; netWorth: number };
                        return { ...item, label: shortMonth(item.month, locale) };
                      }) ?? []
                    }
                  />
                </div>
              </ChartCard>

              {/* Category Trend */}
              <ChartCard title="Tren Kategori" subtitle="Pengeluaran per kategori 6 bulan">
                <div className="h-[300px]">
                  <CategoryLineChart
                    data={
                      d?.categoryTrend?.rows?.map((t: unknown) => {
                        const item = t as Record<string, unknown> & { month: string };
                        return { ...item, label: shortMonth(item.month, locale) };
                      }) ?? []
                    }
                    series={
                      d?.categoryTrend?.[0]
                        ? Object.keys(d.categoryTrend[0] as Record<string, unknown>)
                            .filter((k) => k !== "month")
                            .map((k, i) => ({
                              key: k,
                              name: k,
                              color: PIE[i % PIE.length] ?? "#55C99A",
                            }))
                        : []
                    }
                  />
                </div>
              </ChartCard>
            </div>
          </div>
        </main>
      </div>

      {/* Transaction Dialog */}
      <AnimatePresence>
        {dlg.open && (
          <TransactionDialog
            open={dlg.open}
            onOpenChange={(o) => setDlg({ ...dlg, open: o })}
            initial={dlg.draft}
          />
        )}
      </AnimatePresence>

      {/* Receipt Scanner */}
      <ReceiptScanner
        onDraft={async (draft) => {
          setDlg({ open: true, draft });
        }}
      />
    </TooltipProvider>
  );
}

export const Route = createFileRoute("/_app/dashboard")({
  head: () => pageHead("Dashboard", "Ringkasan keuangan bulanan"),
  component: Dashboard,
});
