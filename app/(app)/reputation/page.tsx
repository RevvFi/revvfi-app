"use client";

import { useAccount } from "wagmi";
import { useBorrower, useBorrowerRisk } from "@/hooks/useBorrower";
import { Card } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatTimestamp, reputationColor } from "@/lib/utils";
import { Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const HISTORY = [
  { month: "Jan", score: 400 }, { month: "Feb", score: 420 }, { month: "Mar", score: 410 },
  { month: "Apr", score: 440 }, { month: "May", score: 450 }, { month: "Jun", score: 450 },
];

const RADAR_DATA = [
  { subject: "Repayment", A: 85 }, { subject: "Collateral", A: 70 }, { subject: "Activity", A: 60 },
  { subject: "History", A: 45 }, { subject: "Diversity", A: 75 },
];

export default function ReputationPage() {
  const { address } = useAccount();
  const { data: borrower, isLoading } = useBorrower(address ?? "");
  const { data: risk } = useBorrowerRisk(address ?? "");

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
                <p className="text-xs text-on-surface-variant mt-2">Top 5% of Institutional Borrowers</p>
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
                  { label: "Total Borrowed", value: `$${(parseFloat(borrower.total_borrowed) / 1e6).toFixed(2)}M` },
                  { label: "Total Repaid", value: `$${(parseFloat(borrower.total_repaid) / 1e6).toFixed(2)}M` },
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

          {/* Score history + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Score History</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={HISTORY}>
                  <defs>
                    <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: "#e4beb3", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[300, 600]} tick={{ fill: "#e4beb3", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#2c1c17", border: "1px solid rgba(255,255,255,0.08)", color: "#fadcd4", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="score" stroke="#ff5a1f" strokeWidth={2} fill="url(#repGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Risk Profile Radar</p>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="#5b4038" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#e4beb3", fontSize: 10 }} />
                  <Radar name="Score" dataKey="A" stroke="#ff5a1f" fill="#ff5a1f" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Benchmark */}
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-on-surface mb-1">Benchmark Comparison</p>
                <p className="text-xs text-on-surface-variant">
                  Your score of <span className={`font-bold ${scoreColor}`}>{score}</span> ({borrower.risk_label}) places you in the{" "}
                  <span className="text-primary font-medium">top 45%</span> of all institutional borrowers on RevvFi. To improve your score, maintain regular repayments and avoid defaults.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
