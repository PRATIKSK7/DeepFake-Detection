import { motion } from "framer-motion";
import { Cpu, Activity, Zap, Target, Shield } from "lucide-react";
import {
  useListModels,
  useGetModelPerformance,
  getListModelsQueryKey,
  getGetModelPerformanceQueryKey,
} from "@workspace/api-client-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function StatusDot({ status }: { status: string }) {
  const color = status === "active" ? "bg-green-400" : status === "degraded" ? "bg-yellow-400" : "bg-red-400";
  return <div className={`w-2 h-2 rounded-full ${color} ${status === "active" ? "animate-pulse" : ""}`} />;
}

function MetricCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: React.ElementType }) {
  return (
    <div className="bg-muted/30 rounded p-3 text-center">
      <Icon className="w-3.5 h-3.5 text-primary mx-auto mb-1.5" />
      <div className="text-lg font-bold font-mono text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {sub && <div className="text-[9px] text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ModelsPage() {
  const { data: modelsData } = useListModels({ query: { queryKey: getListModelsQueryKey() } });
  const { data: perfData } = useGetModelPerformance({ query: { queryKey: getGetModelPerformanceQueryKey() } });

  const models = modelsData?.models ?? [];
  const perf = perfData?.models ?? [];

  const getPerfFor = (name: string) => perf.find(p => p.modelName === name);

  const radarData = perf.length > 0 ? [
    { metric: "Accuracy", ...Object.fromEntries(perf.map(p => [p.modelName.split("-")[0], p.accuracy])) },
    { metric: "Precision", ...Object.fromEntries(perf.map(p => [p.modelName.split("-")[0], p.precision])) },
    { metric: "Recall", ...Object.fromEntries(perf.map(p => [p.modelName.split("-")[0], p.recall])) },
    { metric: "F1 Score", ...Object.fromEntries(perf.map(p => [p.modelName.split("-")[0], p.f1Score])) },
  ] : [];

  const barData = perf.map(p => ({
    name: p.modelName.split("-")[0],
    accuracy: p.accuracy,
    precision: p.precision,
    recall: p.recall,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Model Monitoring</h1>
        <p className="text-muted-foreground mt-1 text-sm">Performance metrics and health status for each detection model in the ensemble pipeline.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {models.map((model, i) => {
          const p = getPerfFor(model.name);
          return (
            <motion.div
              key={model.id}
              className="bg-card border border-card-border rounded-lg p-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusDot status={model.status} />
                    <span className="text-sm font-bold text-foreground">{model.name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">{model.version} — {model.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-primary border border-primary/30 bg-primary/10 rounded px-2 py-0.5">weight {model.weight}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{model.description}</p>

              {p && (
                <div className="grid grid-cols-4 gap-2">
                  <MetricCard label="Accuracy" value={`${p.accuracy.toFixed(1)}%`} icon={Target} />
                  <MetricCard label="Precision" value={`${p.precision.toFixed(1)}%`} icon={Shield} />
                  <MetricCard label="Recall" value={`${p.recall.toFixed(1)}%`} icon={Activity} />
                  <MetricCard label="Avg Inference" value={`${p.avgInferenceMs}ms`} sub={`${p.totalInferences} runs`} icon={Zap} />
                </div>
              )}

              {p && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="text-center bg-red-500/5 border border-red-500/15 rounded p-2">
                    <div className="text-xs font-mono font-bold text-red-400">{p.falsePositiveRate.toFixed(1)}%</div>
                    <div className="text-[9px] text-muted-foreground">False Positive Rate</div>
                  </div>
                  <div className="text-center bg-orange-500/5 border border-orange-500/15 rounded p-2">
                    <div className="text-xs font-mono font-bold text-orange-400">{p.falseNegativeRate.toFixed(1)}%</div>
                    <div className="text-[9px] text-muted-foreground">False Negative Rate</div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {models.length === 0 && (
          <div className="col-span-2 py-12 text-center text-muted-foreground">
            <Cpu className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <div className="text-sm">No model data available</div>
          </div>
        )}
      </div>

      {barData.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-card-border rounded-lg p-5">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Model Performance Comparison</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 25% 18%)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(200 15% 55%)" }} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(200 15% 55%)" }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "hsl(220 40% 11%)", border: "1px solid hsl(220 25% 20%)", borderRadius: "6px", fontSize: "11px" }}
                />
                <Bar dataKey="accuracy" fill="#14b8a6" name="Accuracy" radius={[2, 2, 0, 0]} />
                <Bar dataKey="precision" fill="#3b82f6" name="Precision" radius={[2, 2, 0, 0]} />
                <Bar dataKey="recall" fill="#8b5cf6" name="Recall" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-card-border rounded-lg p-5">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">F1 Score by Model</div>
            <div className="space-y-3 pt-2">
              {perf.map(p => (
                <div key={p.modelName} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-mono text-[10px]">{p.modelName.split("-")[0]}</span>
                    <span className="font-mono text-primary text-[10px]">{p.f1Score.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${p.f1Score}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
