import { motion } from "framer-motion";
import { BarChart3, ShieldAlert, CheckCircle2, HelpCircle, Clock, Image, Video } from "lucide-react";
import {
  useGetAnalyticsSummary,
  useGetDetectionTrends,
  useGetRecentActivity,
  useGetModelPerformance,
  getGetAnalyticsSummaryQueryKey,
  getGetDetectionTrendsQueryKey,
  getGetRecentActivityQueryKey,
  getGetModelPerformanceQueryKey,
} from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Link } from "wouter";

const COLORS = {
  fake: "#ef4444",
  real: "#22c55e",
  uncertain: "#eab308",
  primary: "#14b8a6",
};

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <motion.div
      className="bg-card border border-card-border rounded-lg p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2">{label}</div>
          <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
          {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
        <div className={`w-9 h-9 rounded border flex items-center justify-center ${color.replace("text-", "border-").replace("400", "500/30").replace("green", "green")} bg-current/5`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

function VerdictBadgeSmall({ verdict }: { verdict: string }) {
  const cfg = {
    fake: "text-red-400 bg-red-500/10 border-red-500/30",
    real: "text-green-400 bg-green-500/10 border-green-500/30",
    uncertain: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  }[verdict] ?? "text-muted-foreground bg-muted border-border";
  return (
    <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${cfg}`}>{verdict}</span>
  );
}

export default function DashboardPage() {
  const { data: summary } = useGetAnalyticsSummary({ query: { queryKey: getGetAnalyticsSummaryQueryKey() } });
  const { data: trendsData } = useGetDetectionTrends({ days: 30 }, { query: { queryKey: getGetDetectionTrendsQueryKey({ days: 30 }) } });
  const { data: activityData } = useGetRecentActivity({ limit: 8 }, { query: { queryKey: getGetRecentActivityQueryKey({ limit: 8 }) } });
  const { data: perfData } = useGetModelPerformance({ query: { queryKey: getGetModelPerformanceQueryKey() } });

  const s = summary;
  const trends = trendsData?.trends ?? [];
  const activity = activityData?.activity ?? [];
  const models = perfData?.models ?? [];

  const pieData = s ? [
    { name: "Fake", value: s.fakeDetected, color: COLORS.fake },
    { name: "Real", value: s.realDetected, color: COLORS.real },
    { name: "Uncertain", value: s.uncertainDetected, color: COLORS.uncertain },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Analytics Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Real-time detection performance and pipeline metrics.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Analyzed" value={s?.totalAnalyzed ?? "—"} sub="All time" icon={BarChart3} color="text-primary" />
        <StatCard label="Fake Detected" value={s?.fakeDetected ?? "—"} sub={s ? `${s.fakePercentage.toFixed(1)}% of total` : ""} icon={ShieldAlert} color="text-red-400" />
        <StatCard label="Authentic Media" value={s?.realDetected ?? "—"} sub="Verified real" icon={CheckCircle2} color="text-green-400" />
        <StatCard label="Avg Confidence" value={s ? `${s.averageConfidence.toFixed(1)}%` : "—"} sub={`~${s?.averageProcessingMs ?? 0}ms avg`} icon={Clock} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Images Analyzed" value={s?.totalImagesAnalyzed ?? "—"} icon={Image} color="text-blue-400" />
        <StatCard label="Videos Analyzed" value={s?.totalVideosAnalyzed ?? "—"} icon={Video} color="text-purple-400" />
        <StatCard label="Uncertain" value={s?.uncertainDetected ?? "—"} sub="Needs review" icon={HelpCircle} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-card border border-card-border rounded-lg p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Detection Trends — Last 30 Days</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trends} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="fakeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.fake} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.fake} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.real} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.real} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 25% 18%)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(200 15% 55%)" }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(200 15% 55%)" }} />
              <Tooltip
                contentStyle={{ background: "hsl(220 40% 11%)", border: "1px solid hsl(220 25% 20%)", borderRadius: "6px", fontSize: "11px" }}
                labelStyle={{ color: "hsl(200 20% 90%)" }}
              />
              <Area type="monotone" dataKey="fakeCount" stroke={COLORS.fake} fill="url(#fakeGrad)" strokeWidth={1.5} name="Fake" dot={false} />
              <Area type="monotone" dataKey="realCount" stroke={COLORS.real} fill="url(#realGrad)" strokeWidth={1.5} name="Real" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Verdict Distribution</div>
          {pieData.length > 0 ? (
            <>
              <div className="flex justify-center">
                <PieChart width={140} height={140}>
                  <Pie data={pieData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              <div className="space-y-1.5 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-mono text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Activity</div>
            <Link href="/history">
              <span className="text-[11px] text-primary hover:underline cursor-pointer">View all</span>
            </Link>
          </div>
          <div className="space-y-0 divide-y divide-border">
            {activity.length === 0 && (
              <div className="py-6 text-center text-muted-foreground text-sm">No detections yet</div>
            )}
            {activity.map((item, i) => (
              <motion.div
                key={item.id}
                className="py-2.5 flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <VerdictBadgeSmall verdict={item.verdict} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{item.filename}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{new Date(item.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-xs font-mono text-muted-foreground">{item.confidenceScore.toFixed(0)}%</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Model Health</div>
          <div className="space-y-3">
            {models.length === 0 && (
              <div className="py-6 text-center text-muted-foreground text-sm">No model data</div>
            )}
            {models.map((model) => (
              <div key={model.modelName} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${model.status === "active" ? "bg-green-400" : model.status === "degraded" ? "bg-yellow-400" : "bg-red-400"}`} />
                    <span className="text-[11px] font-mono text-foreground">{model.modelName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-primary">{model.accuracy.toFixed(1)}% acc</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${model.accuracy}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
