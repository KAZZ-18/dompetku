import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
  const { data: d } = useQuery({ ...dashboardQuery(month), placeholderData: (p) => p });
  const { data: nw } = useQuery(netWorthQuery(12, month));
  const { isAdmin, access } = useAccess();
  const canWrite = isAdmin || Object.values(access.grants).includes("manage");
  const [dlg, setDlg] = useState<{ open: boolean; draft: TxDraft }>({
    open: false,
    draft: newTxDraft(),
  });
  if (!d) return <DashboardSkeleton />;
  const prev = previousOf<{ income: number; expense: number }>(d.trend);
  const rate = savingsRate(d.net, d.income);

  // KPI calculations for the four prominent cards
  const netIncome = d.net; // income - expense
  const totalExpenses = d.expense;
  const savingsRatePct = rate !== null ? rate * 100 : 0;
  const totalInvestments = isAdmin
    ? d.balances
        .filter((b: any) => b.type === "investment")
        .reduce((a: number, b: any) => a + b.balance_idr, 0)
    : 0;

  return (
    <>
      <PageHeader
        title={t("Dashboard")}
        subtitle={`${t("Kurs hari ini: 1 USD = ")}${money(d.usdIdr)}`}
        actions={
          canWrite ? (
            <>
              {isAdmin ? (
                <ReceiptScanner onDraft={(draft) => setDlg({ open: true, draft })} />
              ) : null}
              <Button
                variant="secondary"
                onClick={() => setDlg({ open: true, draft: newTxDraft("income") })}
              >
                <Plus className="size-4" /> {t("Pemasukan")}
              </Button>
              <Button onClick={() => setDlg({ open: true, draft: newTxDraft("expense") })}>
                <Plus className="size-4" /> {t("Pengeluaran")}
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="mb-5 flex items-center justify-between gap-2 sm:justify-start">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label={t("Sebelumnya")}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="min-w-0 flex-1 text-center font-display sm:min-w-40 sm:flex-none text-lg font-semibold capitalize">
          {monthLabel(month, locale)}
        </p>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMonth(shiftMonth(month, 1))}
          aria-label={t("Berikutnya")}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Four prominent KPI cards - matching reference design */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label={t("Pendapatan Bersih")}
          value={money(netIncome)}
          icon={<TrendingUp className="size-4" />}
          tone={netIncome >= 0 ? "income" : "expense"}
          trend={
            prev?.income !== undefined
              ? { current: d.income, previous: prev.income, goodWhenUp: true }
              : null
          }
        />
        <StatCard
          label={t("Total Pengeluaran")}
          value={money(totalExpenses)}
          icon={<TrendingDown className="size-4" />}
          tone="expense"
          trend={
            prev?.expense !== undefined
              ? { current: d.expense, previous: prev.expense, goodWhenUp: false }
              : null
          }
        />
        <StatCard
          label={t("Rasio Tabungan")}
          value={`${savingsRatePct.toFixed(1)}%`}
          icon={<PiggyBank className="size-4" />}
          tone={savingsRatePct >= 20 ? "income" : savingsRatePct >= 0 ? "warning" : "expense"}
        />
        <StatCard
          label={isAdmin ? t("Investasi") : t("Saldo Total")}
          value={money(isAdmin ? totalInvestments : d.totalBalanceIdr)}
          icon={<Wallet className="size-4" />}
          tone="primary"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column: Charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cashflow Chart */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("Arus kas 6 bulan")}</h2>
            </div>
            <div className="h-64 short:h-48">
              <CashflowAreaChart
                data={d.trend.map((t: any) => ({ ...t, label: shortMonth(t.month, locale) }))}
                incomeLabel={t("Pemasukan")}
                expenseLabel={t("Pengeluaran")}
              />
            </div>
          </Card>

          {/* Category trend chart */}
          {d.categoryTrend?.categories?.length ? (
            <Card className="p-5">
              <h2 className="mb-4 text-lg font-semibold">
                {t("Tren pengeluaran per kategori (6 bulan)")}
              </h2>
              <div className="h-64 short:h-48">
                <StackedAreaChart
                  data={d.categoryTrend.rows.map((r: any) => ({
                    ...r,
                    label: shortMonth(r.month, locale),
                  }))}
                  keys={d.categoryTrend.categories}
                />
              </div>
            </Card>
          ) : null}

          {/* Recent Transactions Table */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("Transaksi terbaru")}</h2>
              <Link to="/transactions" className="text-xs text-primary hover:underline">
                {t("Semua")}
              </Link>
            </div>
            <ScrollArea className="h-[320px]">
              {d.recent.length ? (
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b border-muted-foreground/20 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3 pr-4">{t("Transaksi")}</th>
                      <th className="pb-3 pr-4 text-center">{t("Kategori")}</th>
                      <th className="pb-3 pr-4 text-center">{t("Akun")}</th>
                      <th className="pb-3 pr-4 text-right">{t("Jumlah")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted-foreground/10">
                    {d.recent.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium truncate max-w-[200px]">
                            {tx.description || tx.merchant || tx.category?.name || "Transaksi"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dateLabel(tx.occurred_at, locale)}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {tx.category ? (
                            <Badge variant="outline" className="gap-1.5">
                              <span
                                className="size-2 rounded-full"
                                style={{ background: tx.category.color }}
                              />
                              {tx.category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {tx.account ? walletLabel(tx.account, t) : "-"}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums font-medium">
                          <span
                            className={
                              tx.kind === "income"
                                ? "text-income"
                                : tx.kind === "expense"
                                  ? "text-expense"
                                  : ""
                            }
                          >
                            {tx.kind === "income" ? "+" : tx.kind === "expense" ? "−" : ""}
                            {money(tx.amount, tx.currency)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {t("Belum ada transaksi. Mulai catat sekarang!")}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Right column: Category breakdown, Net worth, Reminders, Budgets, Accounts */}
        <div className="space-y-4">
          {/* Expense by Category - Donut + List */}
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">{t("Pengeluaran per kategori")}</h2>
            {d.byCategory.length ? (
              <>
                <div className="h-40 flex items-center justify-center">
                  <DonutChart
                    data={d.byCategory.map((c: any, i: number) => ({
                      name: c.name,
                      value: c.value,
                      color: c.color ?? PIE[i % PIE.length],
                    }))}
                    innerRadius={42}
                    outerRadius={70}
                  />
                </div>
                <ul className="mt-4 space-y-3">
                  {d.byCategory.slice(0, 6).map((c: any, i: number) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: c.color ?? PIE[i % PIE.length] }}
                        />
                        <span className="truncate text-sm">{c.name}</span>
                      </div>
                      <span className="num shrink-0 font-mono tabular-nums text-muted-foreground">
                        {money(c.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {t("Belum ada pengeluaran bulan ini.")}
              </div>
            )}
          </Card>

          {/* Net Worth / Wallet Balance Chart */}
          {nw?.length ? (
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {isAdmin ? t("Kekayaan bersih (12 bulan)") : t("Saldo dompet (12 bulan)")}
                </h2>
              </div>
              <div className="h-56 short:h-44">
                <NetWorthChart
                  data={nw.map((r) => ({ ...r, label: shortMonth(r.month, locale) }))}
                  label={isAdmin ? t("Kekayaan bersih (12 bulan)") : t("Saldo dompet (12 bulan)")}
                />
              </div>
              <div className="mt-3 text-right">
                <p className="num text-lg font-semibold font-mono tabular-nums">
                  {money(nw[nw.length - 1]!.netWorth)}
                </p>
                {nw[nw.length - 1]!.gold > 0 ? (
                  <p className="num text-xs text-muted-foreground">
                    {t("termasuk emas")} {money(nw[nw.length - 1]!.gold)}
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}

          {/* Reminders */}
          {isAdmin ? (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t("Pengingat")}</h2>
                <Link to="/reminders" className="text-xs text-primary hover:underline">
                  {t("Semua")}
                </Link>
              </div>
              {d.reminders.length ? (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {d.reminders.map((r: any) => (
                    <li
                      key={r.type + r.id}
                      className="flex items-start justify-between gap-3 text-sm p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 font-medium">
                          {r.overdue ? (
                            <AlertTriangle className="size-3.5 shrink-0 text-expense" />
                          ) : null}
                          <span className="truncate">{r.title}</span>
                        </p>
                        <p
                          className={`text-xs ${
                            r.overdue ? "text-expense" : "text-muted-foreground"
                          }`}
                        >
                          {r.type === "budget"
                            ? t("Peringatan budget")
                            : r.overdue
                              ? `${t("terlambat ")} ${-r.days_left} ${t("hari")}`
                              : r.days_left === 0
                                ? t("Hari ini")
                                : `${r.days_left} ${t("hari lagi")} · ${dateLabel(r.due_date, locale)}`}
                        </p>
                      </div>
                      <span className="num shrink-0 font-mono tabular-nums">
                        {money(r.amount, r.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {t("Tidak ada tagihan 14 hari ke depan.")}
                </div>
              )}
            </Card>
          ) : null}

          {/* Budgets */}
          {isAdmin ? (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t("Budget")}</h2>
                <Link to="/budgets" className="text-xs text-primary hover:underline">
                  {t("Atur")}
                </Link>
              </div>
              {d.budgets.length ? (
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                  {d.budgets.map((b: any) => (
                    <li key={b.id} className="min-w-0">
                      <div className="mb-1 flex justify-between gap-2">
                        <span className="truncate text-sm">{b.category}</span>
                        <span
                          className={`num shrink-0 font-mono tabular-nums ${
                            b.percent >= 100 ? "text-expense" : "text-muted-foreground"
                          }`}
                        >
                          {Math.round(b.percent)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, b.percent)}
                        aria-label={`${b.category} ${Math.round(b.percent)}%`}
                        className="h-1.5"
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {t("Belum ada budget.")}
                </div>
              )}
            </Card>
          ) : null}

          {/* Account Balances */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("Saldo akun")}</h2>
              <Link to="/accounts" className="text-xs text-primary hover:underline">
                {t("Kelola")}
              </Link>
            </div>
            {d.balances.length ? (
              <ul className="space-y-2">
                {d.balances.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{a.name}</span>
                    <span className="num shrink-0 font-mono tabular-nums">
                      {money(a.balance, a.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {t("Tambahkan akun bank / e-wallet.")}
              </div>
            )}
          </Card>

          {/* Goals */}
          {isAdmin ? (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t("Target tabungan")}</h2>
                <Link to="/goals" className="text-xs text-primary hover:underline">
                  {t("Kelola")}
                </Link>
              </div>
              {d.goals.length ? (
                <ul className="space-y-3 max-h-64 overflow-y-auto">
                  {d.goals.map((g: any) => {
                    const p = g.target_amount ? (g.saved_amount / g.target_amount) * 100 : 0;
                    return (
                      <li key={g.id} className="min-w-0">
                        <div className="mb-1 flex justify-between gap-2">
                          <span className="truncate text-sm">{g.name}</span>
                          <span className="num shrink-0 font-mono tabular-nums text-muted-foreground">
                            {Math.round(p)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(100, p)}
                          aria-label={`${g.name} ${Math.round(p)}%`}
                          className="h-1.5"
                        />
                        {(() => {
                          const need = projectGoal({
                            target: g.target_amount,
                            saved: g.saved_amount,
                            deadline: g.deadline,
                            today: todayStr(),
                            createdAt: g.created_at,
                          }).monthlyNeeded;
                          return need ? (
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {t("Setor")}{" "}
                              <span className="num font-mono tabular-nums">{money(need)}</span>/
                              {t("bln")}
                            </p>
                          ) : null;
                        })()}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {t("Belum ada target.")}
                </div>
              )}
            </Card>
          ) : null}
        </div>
      </div>

      <TransactionDialog
        open={dlg.open}
        onOpenChange={(o) => setDlg((s) => ({ ...s, open: o }))}
        initial={dlg.draft}
      />
    </>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "income" | "expense" | "warning" | "primary";
  trend?: { current: number; previous: number | undefined; goodWhenUp: boolean } | null;
}

function StatCard({ label, value, icon, tone, trend }: StatCardProps) {
  usePrivacy();
  const { t } = useI18n();

  const toneClasses = {
    income: "border-l-4 border-l-income bg-green-500/5 dark:bg-green-950/10",
    expense: "border-l-4 border-l-expense bg-red-500/5 dark:bg-red-950/10",
    warning: "border-l-4 border-l-warning bg-yellow-500/5 dark:bg-yellow-950/10",
    primary: "border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10",
  };

  const valueColors = {
    income: "text-income",
    expense: "text-expense",
    warning: "text-warning",
    primary: "text-foreground",
  };

  const iconColors = {
    income: "text-income",
    expense: "text-expense",
    warning: "text-warning",
    primary: "text-primary",
  };

  return (
    <Card className={`relative p-5 ${toneClasses[tone]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`num mt-1.5 break-words text-2xl font-semibold ${valueColors[tone]}`}>
            {value}
          </p>
          {trend && trend.previous !== undefined ? (
            <MonthDelta
              current={trend.current}
              previous={trend.previous}
              goodWhenUp={trend.goodWhenUp}
            />
          ) : null}
        </div>
        <div
          className={`shrink-0 p-2 rounded-xl ${iconColors[tone]}`}
          style={{
            backgroundColor: `${getComputedStyle(document.documentElement).getPropertyValue(`--color-${tone}`) || ""}15`,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function MonthDelta({
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
  const tone = flat ? "" : up === goodWhenUp ? "text-income" : "text-expense";
  return (
    <p className="mt-2">
      <span className={`num font-medium text-xs ${tone}`}>
        <span aria-hidden="true">{flat ? "=" : up ? "▲" : "▼"}</span>
        <span className="sr-only">{flat ? t("Tetap") : up ? t("Naik") : t("Turun")}</span>{" "}
        {formatPercent(Math.abs(pct))}
      </span>{" "}
      <span className="text-xs text-muted-foreground">{t("vs bulan lalu")}</span>
    </p>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}
