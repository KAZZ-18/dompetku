import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-150">
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 150 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: sidebarOpen ? 0 : -280 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed left-0 top-0 z-50 h-screen w-72 bg-background border-r border-border flex flex-col lg:translate-x-0"
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
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
              <Input placeholder={t("Cari cepat...")} className="pl-9 bg-muted border-border" />
            </div>

            {/* Navigation */}
            <nav className="space-y-1" aria-label="Navigasi utama">
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    item.active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
                    className="w-full justify-start gap-3"
                    onClick={() => setDlg({ open: true, draft: newTxDraft("income") })}
                  >
                    <Plus className="size-4" />
                    <span>{t("Pemasukan")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => setDlg({ open: true, draft: newTxDraft("expense") })}
                  >
                    <Plus className="size-4" />
                    <span>{t("Pengeluaran")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
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
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-muted">
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
        <div className="lg:pl-72 flex flex-col min-h-screen">
          {/* Top Bar */}
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
                    {d.reminders.length ? (
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
                                  : `${r.days_left} ${t("hari lagi")} · ${dateLabel(r.due_date, locale)}`}
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
                      <Separator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await logoutFn();
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

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-x-auto">
            <div className="max-w-[1400px] mx-auto space-y-6">
              {/* Welcome Header */}
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

              {/* KPI Cards Row - Monochrome with semantic accents only */}
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

              {/* Middle Row: Charts */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 200, delay: 100 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6"
              >
                {/* Earning Status Chart */}
                <ChartCard
                  title={t("Status Pendapatan")}
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
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 200, delay: 150 }}
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
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {d.reminders.length ? (
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
                                        : `${r.days_left} ${t("hari lagi")} · ${dateLabel(r.due_date, locale)}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono tabular-nums font-medium text-destructive">
                                {money(r.amount, r.currency)}
                              </p>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  r.overdue
                                    ? "bg-destructive/10 text-destructive"
                                    : r.days_left <= 3
                                      ? "bg-warning/10 text-warning"
                                      : "bg-muted-foreground/10 text-muted-foreground"
                                }`}
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
              </motion.div>

              {/* Bottom Row: Transactions + Spending */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 200, delay: 150 }}
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
                                {dateLabel(tx.occurred_at, locale)}
                              </td>
                              <td className="py-3 pr-4 text-center text-xs">
                                {tx.account ? walletLabel(tx.account, t) : "-"}
                              </td>
                              <td className="py-3 pr-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                    tx.kind === "income"
                                      ? "bg-green-500/10 text-green-500"
                                      : tx.kind === "expense"
                                        ? "bg-red-500/10 text-red-500"
                                        : "bg-primary/10 text-primary"
                                  }`}
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
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 200, delay: 200 }}
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

  const trendColors = {
    income: { good: "text-green-500", bad: "text-red-500" },
    expense: { good: "text-green-500", bad: "text-red-500" },
    warning: { good: "text-green-500", bad: "text-red-500" },
    primary: { good: "text-green-500", bad: "text-red-500" },
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

interface MonthDeltaProps {
  current: number;
  previous: number | undefined;
  goodWhenUp: boolean;
}

function MonthDelta({ current, previous, goodWhenUp }: MonthDeltaProps) {
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

/* Animated Charts using Motion + Recharts - Monochrome with green/red semantic colors */
function AnimatedCashflowChart({
  data,
  incomeLabel,
  expenseLabel,
}: {
  data: any[];
  incomeLabel: string;
  expenseLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
        <Legend
          wrapperStyle={{ paddingTop: 10 }}
          iconSize={8}
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: value === incomeLabel ? "#16a34a" : "#ef4444" }}>{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="income"
          stackId="1"
          stroke="#16a34a"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#incomeGradient)"
          name={incomeLabel}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stackId="1"
          stroke="#ef4444"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#expenseGradient)"
          name={expenseLabel}
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
        >
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={data[i].color} />
          ))}
        </Pie>
        <RechartsTooltip
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
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
