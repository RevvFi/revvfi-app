"use client";

import { useAccount } from "wagmi";
import { useBorrower, useBorrowerRisk } from "@/hooks/useBorrower";
import { useMyBorrowerPortfolio } from "@/hooks/usePortfolioData";
import { Card } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimestamp, formatAssetAmounts, reputationColor } from "@/lib/utils";
import { Shield } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function ReputationPage() {
  const { address } = useAccount();
  const { data: borrower, isLoading } = useBorrower(address ?? "");
  const { data: risk } = useBorrowerRisk(address ?? "");
  const borrowerPortfolio = useMyBorrowerPortfolio(address);

  const score = borrower?.reputation_score ?? 0;
  const scorePct = (score / 1000) * 100;
  const scoreColor = reputationColor(score);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-350 mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Reputation</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">On-chain credit reputation derived from borrowing history and protocol behavior</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : !borrower ? (
        <Card className="p-12 flex flex-col items-center gap-4">
          <Shield className="h-16 w-16 text-on-surface-variant" />
          <p className="text-sm text-on-surface-variant">No reputation data — register as a borrower to build your on-chain credit score</p>
        </Card>
      ) : (
        <>
          {/* Hero score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 flex flex-col items-center gap-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Reputation Score</p>
              <div className="relative h-36 w-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ v: score }, { v: 1000 - score }]} cx="50%" cy="50%"
                      innerRadius={48} outerRadius={60} dataKey="v" startAngle={90} endAngle={-270}>
                      <Cell fill="#ff5a1f" />
                      <Cell fill="#43312b" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black ${scoreColor}`}>{score}</span>
                  <span className="text-xs text-on-surface-variant">/ 1000</span>
                </div>
              </div>
              <div className="text-center">
                <RiskBadge label={borrower.risk_label} />
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Risk Breakdown</p>
              <div className="space-y-3">
                {[
                  { label: "Repayment History", value: borrower.success_rate, color: "bg-emerald-400" },
                  { label: "Default Rate", value: 100 - borrower.default_rate, color: "bg-amber-400" },
                  { label: "Active Loans", value: Math.min(100, borrower.active_loans * 20), color: "bg-blue-400" },
                  { label: "Health Factor", value: Math.min(100, (risk?.health_factor ?? 0) * 40), color: "bg-primary-container" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-on-surface-variant">{label}</span>
                      <span className="text-on-surface">{value.toFixed(1)}%</span>
                    </div>
                    <Progress value={value} indicatorClassName={color} />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Loan Performance</p>
              <div className="space-y-3">
                {[
                  { label: "Total Borrowed", value: formatAssetAmounts(borrowerPortfolio.totalPrincipal) },
                  { label: "Active Loans", value: borrower.active_loans },
                  { label: "Failed Loans", value: borrower.failed_loans, danger: true },
                  { label: "Member Since", value: formatTimestamp(borrower.registered_at) },
                ].map(({ label, value, danger }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">{label}</span>
                    <span className={`font-medium mono ${danger && borrower.failed_loans > 0 ? "text-orange-400" : "text-on-surface"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
