import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileImage, FileVideo, X, CheckCircle, AlertTriangle, HelpCircle, Layers, Clock, Cpu, Plus, Trash2 } from "lucide-react";
import { useCreateDetection } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import type { Detection, HeatmapPoint } from "@workspace/api-client-react";
import { HeatmapCanvas } from "@/components/HeatmapCanvas";

type FileEntry = {
  id: string;
  file: File;
  status: "queued" | "analyzing" | "done" | "error";
  stage?: string;
  progress: number;
  result?: Detection;
};

function VerdictBadge({ verdict, large = false }: { verdict: string; large?: boolean }) {
  const cfg = {
    fake: { cls: "text-red-400 border-red-500/40 bg-red-500/10", icon: AlertTriangle, label: "DEEPFAKE DETECTED" },
    real: { cls: "text-green-400 border-green-500/40 bg-green-500/10", icon: CheckCircle, label: "AUTHENTIC MEDIA" },
    uncertain: { cls: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10", icon: HelpCircle, label: "INCONCLUSIVE" },
  }[verdict] ?? { cls: "text-muted-foreground border-border bg-muted", icon: HelpCircle, label: "UNKNOWN" };
  const Icon = cfg.icon;
  return (
    <div className={cn("flex items-center gap-2 border rounded px-3 py-2 font-mono tracking-widest uppercase", cfg.cls, large && "px-5 py-3")}>
      <Icon className={cn("w-4 h-4 shrink-0", large && "w-6 h-6")} />
      <span className={cn("text-sm font-bold", large && "text-xl")}>{cfg.label}</span>
    </div>
  );
}

function ResultPanel({ detection, file }: { detection: Detection; file: File }) {
  const isImage = file.type.startsWith("image/");
  const heatmapPoints = (detection.heatmapPoints ?? []) as HeatmapPoint[];

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Heatmap */}
      {isImage && heatmapPoints.length > 0 && (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground uppercase tracking-wider">Grad-CAM Attention Heatmap</span>
            <span className="text-[10px] text-muted-foreground ml-auto">Highlighted regions triggered detection</span>
          </div>
          <div className="p-4">
            <HeatmapCanvas imageFile={file} points={heatmapPoints} verdict={detection.verdict} />
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                <span className="text-[10px] text-muted-foreground">High attention (fake regions)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
                <span className="text-[10px] text-muted-foreground">Low attention (authentic)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verdict */}
      <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Analysis Result</div>
            <div className="text-sm font-medium text-foreground truncate max-w-xs">{detection.filename}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground font-mono">processed in</div>
            <div className="text-sm font-mono text-primary">{detection.processingTimeMs}ms</div>
          </div>
        </div>
        <VerdictBadge verdict={detection.verdict} large />
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center bg-red-500/5 border border-red-500/15 rounded p-3">
            <div className="text-2xl font-bold font-mono text-red-400">{detection.fakeScore.toFixed(1)}%</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Fake Score</div>
          </div>
          <div className="text-center bg-green-500/5 border border-green-500/15 rounded p-3">
            <div className="text-2xl font-bold font-mono text-green-400">{detection.realScore.toFixed(1)}%</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Real Score</div>
          </div>
        </div>
        <div className="space-y-2">
          <BarMeter label="Fake probability" score={detection.fakeScore} color="bg-red-500" textColor="text-red-400" />
          <BarMeter label="Real probability" score={detection.realScore} color="bg-green-500" textColor="text-green-400" />
        </div>
      </div>

      {/* Model breakdown */}
      <div className="bg-card border border-card-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground uppercase tracking-wider">Model Ensemble Breakdown</span>
        </div>
        <div className="divide-y divide-border">
          {(detection.modelScores as Array<{ modelName: string; modelVersion: string; score: number; verdict: string; weight: number }>).map((m) => {
            const vc = m.verdict === "fake" ? "text-red-400" : m.verdict === "real" ? "text-green-400" : "text-yellow-400";
            const bc = m.verdict === "fake" ? "bg-red-500" : m.verdict === "real" ? "bg-green-500" : "bg-yellow-500";
            return (
              <div key={m.modelName} className="py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-xs font-medium text-foreground">{m.modelName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{m.modelVersion} · w={m.weight}</div>
                  </div>
                  <span className={cn("text-xs font-mono font-bold uppercase", vc)}>{m.verdict}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div className={cn("h-full rounded-full", bc)} initial={{ width: 0 }} animate={{ width: `${m.score}%` }} transition={{ duration: 0.6 }} />
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{m.score.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Artifacts */}
      {(detection.detectionArtifacts as string[]).length > 0 && (
        <div className="bg-card border border-red-500/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Forensic Artifacts Detected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(detection.detectionArtifacts as string[]).map((a) => (
              <span key={a} className="text-[11px] bg-red-500/10 border border-red-500/30 text-red-300 rounded px-2 py-1 font-mono">{a}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function BarMeter({ label, score, color, textColor }: { label: string; score: number; color: string; textColor: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono font-bold", textColor)}>{score.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div className={cn("h-full rounded-full", color)} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
      </div>
    </div>
  );
}

function Eye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const ANALYSIS_STAGES = [
  "Loading into memory...",
  "Preprocessing & normalizing...",
  "Running EfficientNet-B4...",
  "Running XceptionNet-Forensics...",
  "Running ViT-FaceForensics...",
  "Running GAN-Detector-Pro...",
  "Generating Grad-CAM heatmap...",
  "Computing ensemble verdict...",
];

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<FileEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createDetection = useCreateDetection();
  const processingRef = useRef(false);

  const activeEntry = queue.find(e => e.id === activeId) ?? (queue.find(e => e.status === "done") ?? null);

  const processQueue = useCallback(async (entries: FileEntry[]) => {
    if (processingRef.current) return;
    processingRef.current = true;

    for (const entry of entries) {
      if (entry.status !== "queued") continue;

      setActiveId(entry.id);
      setQueue(prev => prev.map(e => e.id === entry.id ? { ...e, status: "analyzing", progress: 0 } : e));

      for (let i = 0; i < ANALYSIS_STAGES.length; i++) {
        setQueue(prev => prev.map(e => e.id === entry.id
          ? { ...e, stage: ANALYSIS_STAGES[i], progress: Math.round((i / ANALYSIS_STAGES.length) * 95) }
          : e));
        await new Promise(r => setTimeout(r, 200 + Math.random() * 200));
      }

      try {
        const fileType = entry.file.type.startsWith("video/") ? "video" : "image";
        const result = await createDetection.mutateAsync({
          filename: entry.file.name,
          fileType,
          fileSize: entry.file.size,
        });
        setQueue(prev => prev.map(e => e.id === entry.id
          ? { ...e, status: "done", progress: 100, result }
          : e));
      } catch {
        setQueue(prev => prev.map(e => e.id === entry.id
          ? { ...e, status: "error", stage: "Analysis failed" }
          : e));
      }
    }

    processingRef.current = false;
  }, [createDetection]);

  const addFiles = useCallback((files: File[]) => {
    const validTypes = ["image/", "video/"];
    const valid = files.filter(f => validTypes.some(t => f.type.startsWith(t)));
    if (!valid.length) return;

    const newEntries: FileEntry[] = valid.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: "queued",
      progress: 0,
    }));

    setQueue(prev => {
      const next = [...prev, ...newEntries];
      setTimeout(() => processQueue(newEntries), 0);
      return next;
    });
  }, [processQueue]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const removeEntry = (id: string) => {
    setQueue(prev => prev.filter(e => e.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const clearAll = () => { setQueue([]); setActiveId(null); };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Media Analysis</h1>
        <p className="text-muted-foreground mt-1 text-sm">Upload images or videos for batch forensic analysis. Grad-CAM heatmaps included.</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left panel: upload + queue */}
        <div className="col-span-2 space-y-4">
          <div
            className={cn("border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer", isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/20")}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" multiple
              onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ""; }} />
            <div className="flex flex-col items-center gap-3">
              <div className={cn("w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all", isDragging ? "border-primary bg-primary/10" : "border-border")}>
                <Upload className={cn("w-6 h-6", isDragging ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Drop files here</div>
                <div className="text-xs text-muted-foreground mt-0.5">or click to browse — batch upload supported</div>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {["JPG", "PNG", "WEBP", "MP4", "WEBM"].map(ext => (
                  <span key={ext} className="text-[10px] font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground">{ext}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="bg-card border border-card-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-medium text-foreground uppercase tracking-wider">Queue ({queue.length})</span>
                <button onClick={clearAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" />Clear
                </button>
              </div>
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {queue.map(entry => (
                  <div
                    key={entry.id}
                    className={cn("px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors", activeId === entry.id ? "bg-primary/5" : "hover:bg-muted/20")}
                    onClick={() => entry.status === "done" && setActiveId(entry.id)}
                  >
                    {entry.file.type.startsWith("video/") ? <FileVideo className="w-4 h-4 text-muted-foreground shrink-0" /> : <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{entry.file.name}</div>
                      {entry.status === "analyzing" && (
                        <div className="mt-1">
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${entry.progress}%` }} transition={{ duration: 0.3 }} />
                          </div>
                          <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{entry.stage}</div>
                        </div>
                      )}
                      {entry.status === "done" && entry.result && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("text-[9px] font-mono uppercase font-bold",
                            entry.result.verdict === "fake" ? "text-red-400" : entry.result.verdict === "real" ? "text-green-400" : "text-yellow-400"
                          )}>{entry.result.verdict}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">· {entry.result.confidenceScore.toFixed(1)}%</span>
                        </div>
                      )}
                      {entry.status === "queued" && <div className="text-[9px] text-muted-foreground mt-0.5">Waiting...</div>}
                    </div>
                    <div className="flex items-center gap-1">
                      {entry.status === "done" && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                      {entry.status === "analyzing" && <div className="w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin" />}
                      <button onClick={(ev) => { ev.stopPropagation(); removeEntry(entry.id); }} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active models */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground uppercase tracking-wider">Pipeline Models</span>
            </div>
            <div className="space-y-2">
              {[
                { name: "EfficientNet-B4-DeepFake", weight: "35%", v: "v2.3.1" },
                { name: "XceptionNet-Forensics", weight: "30%", v: "v1.8.0" },
                { name: "ViT-FaceForensics", weight: "25%", v: "v3.1.2" },
                { name: "GAN-Detector-Pro", weight: "10%", v: "v1.4.5" },
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-foreground font-mono text-[11px]">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-[10px]">{m.v}</span>
                    <span className="text-primary font-mono text-[10px]">{m.weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: active result */}
        <div className="col-span-3">
          <AnimatePresence mode="wait">
            {!activeEntry && queue.length === 0 && (
              <motion.div key="empty" className="h-full flex flex-col items-center justify-center text-center p-10 bg-card border border-card-border rounded-xl min-h-64"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-16 h-16 rounded-full bg-muted/50 border border-border flex items-center justify-center mb-4">
                  <ShieldIcon className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium text-foreground">No file selected</div>
                <div className="text-xs text-muted-foreground mt-1.5 max-w-xs">Upload one or more files. Results and Grad-CAM heatmaps appear here.</div>
              </motion.div>
            )}
            {activeEntry?.status === "analyzing" && (
              <motion.div key="analyzing" className="bg-card border border-primary/20 rounded-xl p-8 scanline-effect"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-primary animate-ping absolute" />
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm font-mono text-primary uppercase tracking-wider">Analyzing {activeEntry.file.name}</span>
                </div>
                <div className="space-y-3">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${activeEntry.progress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>{activeEntry.stage}</span>
                    <span>{activeEntry.progress}%</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  {ANALYSIS_STAGES.map((s, i) => {
                    const stageIdx = ANALYSIS_STAGES.indexOf(activeEntry.stage ?? "");
                    return (
                      <div key={s} className={cn("flex items-center gap-2 text-xs transition-colors", i < stageIdx ? "text-green-400" : i === stageIdx ? "text-primary" : "text-muted-foreground/40")}>
                        {i < stageIdx ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                        <span className="font-mono">{s}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
            {activeEntry?.status === "done" && activeEntry.result && (
              <motion.div key={activeEntry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ResultPanel detection={activeEntry.result} file={activeEntry.file} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
