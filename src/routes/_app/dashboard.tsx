import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Target,
  CreditCard,
  Search,
  Menu,
  X,
  Bell,
  Settings,
  User,
  LogOut,
  Home,
  DollarSign,
  PiggyBank as PiggyBankIcon,
  CreditCard as CreditCardIcon,
  TrendingUp as TrendingUpIcon,
  Calendar,
  Clock,
  ChevronDown,
  DollarSign as DollarSignIcon,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { RouteError } from "@/components/route-error";
import { TransactionDialog, newTxDraft, type TxDraft } from "@/components/transaction-dialog";
import { AssetsOverview } from "@/components/assets-overview";
import {
  CashflowAreaChart,
  DonutChart,
  NetWorthChart,
  StackedAreaChart,
} from "@/components/charts";
import { CHART_PALETTE as PIE } from "@/components/charts/shared";
import { PENDING_MS, DashboardSkeleton } from "@/components/skeletons";
import { ReceiptScanner } from "@/components/receipt-scanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { dashboardQuery, netWorthQuery } from "@/lib/queries";
import { currentMonth, dateLabel, monthLabel, shiftMonth, shortMonth, todayStr } from "@/lib/dates";
import { projectGoal } from "@/lib/goals";
import { money } from "@/lib/format";
import { usePrivacy } from "@/lib/privacy";
import { useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/head";
import { formatPercent, monthChange, previousOf, savingsRate } from "@/lib/ratio";
import { IncomeRatioCard } from "@/components/income-ratio-card";
import { PocketWarnings } from "@/components/pocket-warnings";
import { useAccess } from "@/hooks/use-access";
import { walletLabel } from "@/lib/permissions";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { logout } from "@/lib/auth.functions";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  LabelList,
} from "recharts";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const Route = createFileRoute("/_app/dashboard")({
  head: () =>
    pageHead(
      "Dashboard",
      "Ringkasan pemasukan, pengeluaran, saldo, hutang, dan pengingat bulan ini.",
    ),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery(currentMonth())),
  errorComponent: RouteError,
  pendingComponent: DashboardSkeleton,
  pendingMs: PENDING_MS,
  component: Dashboard,
});

function Dashboard() {
  usePrivacy();
  const { t, lang } = useI18n();
  const locale = lang === "en" ? "en-US" : "id-ID";
  const [month, setMonth] = useState(currentMonth());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: d } = useQuery({ ...dashboardQuery(month), placeholderData: (p) => p });
  const { data: nw } = useQuery(netWorthQuery(12, month));
  const { isAdmin, access } = useAccess();
  const canWrite = isAdmin || Object.values(access.grants).includes("manage");
  const [dlg, setDlg] = useState<{ open: boolean; draft: TxDraft }>({
    open: false,
    draft: newTxDraft(),
  });
  const logoutFn = useServerFn(logout);
  if (!d) return <DashboardSkeleton />;
  const prev = previousOf<{ income: number; expense: number }>(d.trend);
  const rate = savingsRate(d.net, d.income);

  const netIncome = d.net;
  const totalExpenses = d.expense;
  const savingsRatePct = rate !== null ? rate * 100 : 0;
  const totalInvestments = isAdmin
    ? d.balances
        .filter((b: any) => b.type === "investment")
        .reduce((a: number, b: any) => a + b.balance_idr, 0)
    : 0;
  const totalBalance = d.totalBalanceIdr;

  const sidebarItems = [
    { icon: Home, label: t("Overview"), href: "/dashboard", active: true },
    { icon: DollarSignIcon, label: t("Transaksi"), href: "/transactions" },
    { icon: PiggyBankIcon, label: t("Budget"), href: "/budgets" },
    { icon: CreditCardIcon, label: t("Akun"), href: "/accounts" },
    { icon: Target, label: t("Target"), href: "/goals" },
    { icon: TrendingUpIcon, label: t("Laporan"), href: "/reports" },
  ];

  const chartColors = {
    income: "#22c55e",
    expense: "#ef4444",
    savings: "#14b8a6",
    investment: "#f59e0b",
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background dark:bg-gray-950 text-foreground dark:text-gray-100 transition-colors duration-300">
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
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
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: sidebarOpen ? 0 : -300 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed left-0 top-0 z-50 h-screen w-64 bg-card dark:bg-gray-900 border-r border-border dark:border-gray-800 flex flex-col transition-transform duration-300 lg:translate-x-0"
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-border dark:border-gray-800">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 font-display text-xl font-bold"
            >
              <svg
                className="size-8 text-primary"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="32" height="32" rx="8" fill="currentColor" />
                <path
                  d="M8 16L14 22L24 10"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="truncate">Dompetku</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup sidebar"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t("Cari cepat...")}
                className="pl-9 bg-muted/50 dark:bg-gray-800/50 border-border dark:border-gray-700"
              />
            </div>

            {/* Navigation */}
            <nav className="space-y-1" aria-label="Navigasi utama">
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    item.active
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground dark:hover:bg-gray-800/50"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="size-5 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <Separator className="my-2" />

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("Aksi Cepat")}
              </p>
              {canWrite && (
                <>
                  <Button
                    variant="default"
                    className="w-full justify-start gap-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => setDlg({ open: true, draft: newTxDraft("income") })}
                  >
                    <Plus className="size-4" />
                    <span>{t("Pemasukan")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 border-border dark:border-gray-700"
                    onClick={() => setDlg({ open: true, draft: newTxDraft("expense") })}
                  >
                    <Plus className="size-4" />
                    <span>{t("Pengeluaran")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 border-border dark:border-gray-700"
                    onClick={() => setDlg({ open: true, draft: newTxDraft("transfer") })}
                  >
                    <ArrowUpRight className="size-4" />
                    <span>{t("Transfer")}</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-border dark:border-gray-800">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-muted/50 dark:bg-gray-800/50">
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
              <Button variant="ghost" size="icon" className="flex-1 justify-start gap-2 px-3">
                <Settings className="size-4" />
                <span className="text-sm">{t("Pengaturan")}</span>
              </Button>
              <Button variant="ghost" size="icon" className="flex-1 justify-start gap-2 px-3">
                <LogOut className="size-4" />
                <span className="text-sm">{t("Keluar")}</span>
              </Button>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 h-16 bg-background/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-border dark:border-gray-800 flex items-center justify-between px-4 lg:px-8">
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
              <div className="hidden sm:flex items-center gap-2 bg-muted/50 dark:bg-gray-800/50 rounded-xl px-4 py-2 border border-border dark:border-gray-700">
                <Calendar className="size-4 text-muted-foreground" />
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium focus-visible:outline-none cursor-pointer appearance-none text-foreground"
                  aria-label={t("Pilih bulan")}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = `2025-${String(i + 1).padStart(2, "0")}`;
                    return (
                      <option key={m} value={m}>
                        {monthLabel(m, locale)}
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
                    {d.reminders.length > 0 && (
                      <span className="absolute -top-1 -right-1 size-4 rounded-full bg-expense text-expense-foreground text-[10px] font-bold flex items-center justify-center">
                        {d.reminders.length > 9 ? "9+" : d.reminders.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="w-80 p-0">
                  <div className="p-3 border-b border-border dark:border-gray-800">
                    <p className="font-semibold">{t("Pengingat")}</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {d.reminders.length ? (
                      d.reminders.map((r: any) => (
                        <div
                          key={r.type + r.id}
                          className="px-3 py-2 hover:bg-muted/50 dark:hover:bg-gray-800/50 border-b border-border/50 dark:border-gray-800/50 last:border-0"
                        >
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.type === "budget"
                              ? t("Peringatan budget")
                              : r.overdue
                                ? `${t("Terlambat")} ${-r.days_left} ${t("hari")}`
                                : r.days_left === 0
                                  ? t("Hari ini")
                                  : `${r.days_left} ${t("hari lagi")}`}
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
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/logo.svg" alt="" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {isAdmin ? "A" : "M"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="end" className="w-56 p-1">
                  <div className="px-3 py-2 border-b border-border dark:border-gray-800">
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
                      <Separator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await logoutFn();
                          window.location.href = "/login";
                        }}
                        className="text-expense focus:text-expense"
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

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-8 overflow-x-auto">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Welcome Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
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
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
                  onClick={() => setDlg({ open: true, draft: newTxDraft("income") })}
                >
                  <Plus className="size-4" />
                  <span>{t("Tambah Transaksi")}</span>
                </Button>
              </motion.div>

              {/* KPI Cards Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
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
                  delay={0}
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
                  delay={0.05}
                />
                <KPICard
                  title={t("Rasio Tabungan")}
                  value={`${savingsRatePct.toFixed(1)}%`}
                  icon={<PiggyBank className="size-5" />}
                  color={
                    savingsRatePct >= 20 ? "income" : savingsRatePct >= 0 ? "warning" : "expense"
                  }
                  delay={0.1}
                />
                <KPICard
                  title={isAdmin ? t("Investasi") : t("Saldo Total")}
                  value={money(isAdmin ? totalInvestments : totalBalance)}
                  icon={<Wallet className="size-5" />}
                  color="primary"
                  delay={0.15}
                />
              </motion.div>

              {/* Middle Row: Charts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
              >
                {/* Earning Status Chart */}
                <ChartCard
                  title={t("Status Pendapatan")}
                  subtitle={t("6 bulan terakhir")}
                  action={
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger className="w-[160px] bg-muted/50 dark:bg-gray-800/50 border-border dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => {
                          const m = `2025-${String(i + 1).padStart(2, "0")}`;
                          return (
                            <SelectItem key={m} value={m}>
                              {monthLabel(m, locale)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  }
                >
                  <div className="h-[320px] short:h-[260px]">
                    <AnimatedCashflowChart
                      data={d.trend.map((t: any) => ({ ...t, label: shortMonth(t.month, locale) }))}
                      incomeLabel={t("Pemasukan")}
                      expenseLabel={t("Pengeluaran")}
                    />
                  </div>
                </ChartCard>

                {/* Upcoming Bills / Reminders */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="space-y-4"
                >
                  <ChartCard
                    title={t("Tagihan Mendatang")}
                    subtitle={t("14 hari ke depan")}
                    action={
                      <Link to="/reminders" className="text-xs text-primary hover:underline">
                        {t("Lihat semua")}
                      </Link>
                    }
                  >
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                      {d.reminders.length ? (
                        d.reminders.map((r: any, i: number) => (
                          <motion.div
                            key={r.type + r.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 dark:bg-gray-800/50 border border-border dark:border-gray-800 hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="size-10 shrink-0 rounded-xl bg-card dark:bg-gray-800 flex items-center justify-center border border-border dark:border-gray-700">
                                <AlertTriangle className="size-5 text-expense" />
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
                                        : `${r.days_left} ${t("hari lagi")} · ${dateLabel(r.due_date, locale)}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono tabular-nums font-semibold text-expense">
                                {money(r.amount, r.currency)}
                              </p>
                              <Badge
                                variant={
                                  r.overdue
                                    ? "destructive"
                                    : r.days_left <= 3
                                      ? "outline"
                                      : "secondary"
                                }
                                className="text-xs mt-1"
                              >
                                {r.overdue
                                  ? t("Terlambat")
                                  : r.days_left <= 3
                                    ? t("Segera")
                                    : t("Dijadwalkan")}
                              </Badge>
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
              </motion.div>

              {/* Bottom Row: Transactions + Spending */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
              >
                {/* Recent Transactions */}
                <ChartCard
                  title={t("Transaksi Terbaru")}
                  subtitle={t("10 transaksi terakhir")}
                  action={
                    <Link to="/transactions" className="text-xs text-primary hover:underline">
                      {t("Lihat semua")}
                    </Link>
                  }
                >
                  <ScrollArea className="h-[420px] short:h-[360px]">
                    {d.recent.length ? (
                      <table className="w-full text-sm" role="table">
                        <thead>
                          <tr className="border-b border-border dark:border-gray-800 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <th className="pb-3 pr-4">{t("Merchant")}</th>
                            <th className="pb-3 pr-4 text-center">{t("Tanggal")}</th>
                            <th className="pb-3 pr-4 text-center">{t("Akun")}</th>
                            <th className="pb-3 pr-4 text-center">{t("Tipe")}</th>
                            <th className="pb-3 pr-4 text-right">{t("Jumlah")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 dark:divide-gray-800/50">
                          {d.recent.map((tx: any, i: number) => (
                            <motion.tr
                              key={tx.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: i * 0.03 }}
                              className="hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="size-9 shrink-0 rounded-xl bg-card dark:bg-gray-800 flex items-center justify-center border border-border dark:border-gray-700">
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
                                {dateLabel(tx.occurred_at, locale)}
                              </td>
                              <td className="py-3 pr-4 text-center text-xs">
                                {tx.account ? walletLabel(tx.account, t) : "-"}
                              </td>
                              <td className="py-3 pr-4 text-center">
                                <Badge
                                  variant={
                                    tx.kind === "income"
                                      ? "default"
                                      : tx.kind === "expense"
                                        ? "destructive"
                                        : "outline"
                                  }
                                  className="text-xs gap-1"
                                >
                                  {tx.kind === "income" && <ArrowUpRight className="size-3" />}
                                  {tx.kind === "expense" && <ArrowDownRight className="size-3" />}
                                  {tx.kind === "transfer" && <ArrowUpRight className="size-3" />}
                                  {t(
                                    tx.kind === "income"
                                      ? "Masuk"
                                      : tx.kind === "expense"
                                        ? "Keluar"
                                        : "Transfer",
                                  )}
                                </Badge>
                              </td>
                              <td className="py-3 pr-4 text-right font-mono tabular-nums font-medium">
                                <span
                                  className={
                                    tx.kind === "income"
                                      ? "text-income"
                                      : tx.kind === "expense"
                                        ? "text-expense"
                                        : "text-primary"
                                  }
                                >
                                  {tx.kind === "income" ? "+" : tx.kind === "expense" ? "−" : ""}
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

                {/* Spending Donut Chart */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="space-y-4"
                >
                  <ChartCard title={t("Pengeluaran per Kategori")} subtitle={t("Bulan ini")}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-full max-w-xs">
                        <AnimatedDonutChart
                          data={d.byCategory.map((c: any, i: number) => ({
                            name: c.name,
                            value: c.value,
                            color: c.color ?? PIE[i % PIE.length],
                          }))}
                          innerRadius={50}
                          outerRadius={80}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="font-display text-2xl font-bold tabular-nums">
                              {money(d.expense)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("Total Pengeluaran")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="w-full space-y-2">
                        {d.byCategory.slice(0, 6).map((c: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors"
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
                                {d.expense > 0
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
              </motion.div>
            </div>
          </main>
        </div>

        <TransactionDialog
          open={dlg.open}
          onOpenChange={(o) => setDlg((s) => ({ ...s, open: o }))}
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
  delay: number;
}

function KPICard({ title, value, icon, trend, color, delay }: KPICardProps) {
  usePrivacy();
  const { t } = useI18n();

  const colorConfig = {
    income: {
      bg: "bg-green-500/10 dark:bg-green-950/20",
      border: "border-green-500/20 dark:border-green-500/30",
      iconBg: "bg-green-500/20 dark:bg-green-500/30",
      iconColor: "text-green-500",
      valueColor: "text-green-400 dark:text-green-300",
      trendGood: "text-green-400",
      trendBad: "text-red-400",
    },
    expense: {
      bg: "bg-red-500/10 dark:bg-red-950/20",
      border: "border-red-500/20 dark:border-red-500/30",
      iconBg: "bg-red-500/20 dark:bg-red-500/30",
      iconColor: "text-red-500",
      valueColor: "text-red-400 dark:text-red-300",
      trendGood: "text-green-400",
      trendBad: "text-red-400",
    },
    warning: {
      bg: "bg-yellow-500/10 dark:bg-yellow-950/20",
      border: "border-yellow-500/20 dark:border-yellow-500/30",
      iconBg: "bg-yellow-500/20 dark:bg-yellow-500/30",
      iconColor: "text-yellow-500",
      valueColor: "text-yellow-400 dark:text-yellow-300",
      trendGood: "text-green-400",
      trendBad: "text-red-400",
    },
    primary: {
      bg: "bg-primary/10 dark:bg-primary/20",
      border: "border-primary/20 dark:border-primary/30",
      iconBg: "bg-primary/20 dark:bg-primary/30",
      iconColor: "text-primary",
      valueColor: "text-primary dark:text-primary",
      trendGood: "text-green-400",
      trendBad: "text-red-400",
    },
  };

  const c = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 200, delay }}
      className={`relative p-5 rounded-2xl border ${c.bg} ${c.border} hover:border-primary/50 transition-all duration-300 group`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.1, duration: 0.3 }}
            className={`num mt-2 break-words text-2xl lg:text-3xl font-bold ${c.valueColor}`}
          >
            {value}
          </motion.p>
          {trend && trend.previous !== undefined ? (
            <MonthDelta
              current={trend.current}
              previous={trend.previous}
              goodWhenUp={trend.goodWhenUp}
              goodColor={c.trendGood}
              badColor={c.trendBad}
            />
          ) : null}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 150, delay: delay + 0.15 }}
          className={`shrink-0 p-3 rounded-xl ${c.iconBg} ${c.iconColor}`}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}

interface MonthDeltaProps {
  current: number;
  previous: number | undefined;
  goodWhenUp: boolean;
  goodColor: string;
  badColor: string;
}

function MonthDelta({ current, previous, goodWhenUp, goodColor, badColor }: MonthDeltaProps) {
  const { t } = useI18n();
  const pct = monthChange(current, previous);
  if (pct === null)
    return <p className="mt-2 text-xs text-muted-foreground">{t("Belum ada data bulan lalu")}</p>;
  const flat = Math.round(pct) === 0;
  const up = pct > 0;
  const tone = flat ? "text-muted-foreground" : up === goodWhenUp ? goodColor : badColor;
  return (
    <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
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
    <Card className="p-5 bg-card dark:bg-gray-900 border-border dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">
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

/* Animated Charts using Framer Motion + Recharts */
function AnimatedCashflowChart({
  data,
  incomeLabel,
  expenseLabel,
}: {
  data: any[];
  incomeLabel: string;
  expenseLabel: string;
}) {
  const colors = {
    income: "#22c55e",
    expense: "#ef4444",
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.income} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.income} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.expense} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.expense} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          axisLine={{ stroke: "#374151" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value)}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          }}
          labelStyle={{ color: "#f3f4f6", fontWeight: 600 }}
          itemStyle={{ fontSize: 12 }}
          formatter={(value: number) => [money(value), ""]}
        />
        <Legend
          wrapperStyle={{ paddingTop: 10 }}
          iconSize={8}
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: value === incomeLabel ? colors.income : colors.expense }}>
              {value}
            </span>
          )}
        />
        <Area
          type="monotone"
          dataKey="income"
          stackId="1"
          stroke={colors.income}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#incomeGradient)"
          name={incomeLabel}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="expense"
          stackId="1"
          stroke={colors.expense}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#expenseGradient)"
          name={expenseLabel}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function AnimatedDonutChart({
  data,
  innerRadius,
  outerRadius,
}: {
  data: any[];
  innerRadius: number;
  outerRadius: number;
}) {
  const COLORS = data.map((d) => d.color);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
          animationDuration={1000}
          animationEasing="ease-out"
        >
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i]} />
          ))}
        </Pie>
        <RechartsTooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          }}
          formatter={(value: number) => [money(value), ""]}
        />
        <Legend
          layout="vertical"
          wrapperStyle={{ paddingTop: 20 }}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}
