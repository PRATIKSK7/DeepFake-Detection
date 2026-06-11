import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Cpu, Layers, Clock, FileImage, FileVideo, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { useGetDetection, getGetDetectionQueryKey } from "@workspace/api-client-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

function VerdictDisplay({ verdict, score }: { verdict: string; score: number }) {
  const config = {
    fake: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      icon: AlertTriangle,
      label: "DEEPFAKE DETECTED",
    },
    real: {
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      icon: CheckCircle,
      label: "AUTHENTIC MEDIA",
    },
    uncertain: {
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      icon: HelpCircle,
      label: "INCONCLUSIVE",
    },
  }[verdict] ?? { color: "text-muted-foreground", bg: "bg-muted", border: "border-border", icon: HelpCircle, label: "UNKNOWN" };

  const Icon = config.icon;

  return (
    <motion.div
      className={`flex flex-col items-center gap-3 p-8 rounded-xl border-2 ${config.bg} ${config.border} verdict-reveal`}
    >
      <Icon className={`w-12 h-12 ${config.color}`} />
      <div className={`text-2xl font-bold font-mono uppercase tracking-widest ${config.color}`}>{config.label}</div>
      <div className="text-5xl font-bold font-mono text-foreground">{score.toFixed(1)}%</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">confidence score</div>
    </motion.div>
  );
}

export default function DetectionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");

  const { data: detection, isLoading } = useGetDetection(
    id,
    { query: { enabled: !!id, queryKey: getGetDetectionQueryKey(id) } }
  );

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="text-muted-foreground text-sm">Loading analysis...</div>
      </div>
    );
  }

  if (!detection) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground text-sm">Detection not found.</div>
        <Link href="/history">
          <button className="mt-4 text-primary text-sm hover:underline">Back to History</button>
        </Link>
      </div>
    );
  }

  const modelScores = detection.modelScores as Array<{ modelName: string; modelVersion: string; score: number; verdict: string; weight: number }>;
  const artifacts = detection.detectionArtifacts as string[];

  const radarData = modelScores.map(m => ({
    model: m.modelName.split("-")[0],
    score: m.score,
  }));

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/history">
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </button>
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {detection.fileType === "video" ? (
                <FileVideo className="w-5 h-5 text-muted-foreground" />
              ) : (
                <FileImage className="w-5 h-5 text-muted-foreground" />
              )}
              <h1 className="text-xl font-bold text-foreground">{detection.filename}</h1>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-mono">
              <span className="uppercase">{detection.fileType}</span>
              <span>·</span>
              <span>{(detection.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              <span>·</span>
              <span>{new Date(detection.createdAt).toLocaleString()}</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{detection.processingTimeMs}ms processing time</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <VerdictDisplay verdict={detection.verdict} score={detection.confidenceScore} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground uppercase tracking-wider">Model Ensemble Results</span>
          </div>
          <div className="space-y-3">
            {modelScores.map((model, i) => {
              const verdictColor = model.verdict === "fake" ? "text-red-400" : model.verdict === "real" ? "text-green-400" : "text-yellow-400";
              const barColor = model.verdict === "fake" ? "bg-red-500" : model.verdict === "real" ? "bg-green-500" : "bg-yellow-500";
              return (
                <motion.div
                  key={model.modelName}
                  className="space-y-1.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-foreground">{model.modelName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{model.modelVersion} · w={model.weight}</div>
                    </div>
                    <div className={`text-[10px] font-mono font-bold uppercase ${verdictColor}`}>{model.score.toFixed(1)}%</div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${model.score}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.1 + 0.2 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-card-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold font-mono text-red-400">{detection.fakeScore.toFixed(1)}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Fake Score</div>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold font-mono text-green-400">{detection.realScore.toFixed(1)}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Real Score</div>
            </div>
          </div>

          {radarData.length > 0 && (
            <div className="bg-card border border-card-border rounded-lg p-5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Model Fake Scores</div>
              <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(220 25% 18%)" />
                  <PolarAngleAxis dataKey="model" tick={{ fontSize: 9, fill: "hsl(200 15% 55%)" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Fake Score" dataKey="score" stroke="hsl(185 85% 50%)" fill="hsl(185 85% 50%)" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {artifacts.length > 0 && (
        <div className="bg-card border border-red-500/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Forensic Artifacts Detected</span>
            <span className="text-[10px] text-muted-foreground ml-1">({artifacts.length} found)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {artifacts.map((artifact, i) => (
              <motion.span
                key={artifact}
                className="text-xs bg-red-500/10 border border-red-500/30 text-red-300 rounded px-3 py-1.5 font-mono"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                {artifact}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {artifacts.length === 0 && (
        <div className="bg-card border border-green-500/20 rounded-lg p-5 text-center">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-sm font-medium text-green-400">No forensic artifacts detected</div>
          <div className="text-xs text-muted-foreground mt-1">This media file appears to be authentic</div>
        </div>
      )}
    </div>
  );
}
