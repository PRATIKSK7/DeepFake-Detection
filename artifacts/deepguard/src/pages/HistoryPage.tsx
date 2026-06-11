import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, ExternalLink, Filter } from "lucide-react";
import {
  useListDetections,
  getListDetectionsQueryKey,
} from "@workspace/api-client-react";

type VerdictFilter = "real" | "fake" | "uncertain" | undefined;

function VerdictBadge({ verdict }: { verdict: string }) {
  const cfg = {
    fake: "text-red-400 bg-red-500/10 border-red-500/30",
    real: "text-green-400 bg-green-500/10 border-green-500/30",
    uncertain: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  }[verdict] ?? "text-muted-foreground bg-muted border-border";
  return (
    <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${cfg}`}>{verdict}</span>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [verdict, setVerdict] = useState<VerdictFilter>(undefined);
  const limit = 15;

  const { data, isLoading } = useListDetections(
    { page, limit, verdict },
    { query: { queryKey: getListDetectionsQueryKey({ page, limit, verdict }) } }
  );

  const detections = data?.detections ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const filters: Array<{ label: string; value: VerdictFilter }> = [
    { label: "All", value: undefined },
    { label: "Fake", value: "fake" },
    { label: "Real", value: "real" },
    { label: "Uncertain", value: "uncertain" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Detection History</h1>
        <p className="text-muted-foreground mt-1 text-sm">Complete log of all analyzed media files.</p>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filter by verdict:</span>
            <div className="flex gap-1.5">
              {filters.map(f => (
                <button
                  key={String(f.value)}
                  onClick={() => { setVerdict(f.value); setPage(1); }}
                  className={`text-xs px-3 py-1 rounded font-medium transition-all ${
                    verdict === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono">{total} total records</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-5 py-3">File</th>
                <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-3 py-3">Type</th>
                <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-3 py-3">Verdict</th>
                <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-3 py-3">Confidence</th>
                <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-3 py-3">Size</th>
                <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-3 py-3">Date</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground text-sm">Loading...</td>
                </tr>
              )}
              {!isLoading && detections.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground text-sm">No detections found</td>
                </tr>
              )}
              {detections.map((d, i) => (
                <motion.tr
                  key={d.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td className="px-5 py-3">
                    <div className="text-xs font-medium text-foreground truncate max-w-[200px]">{d.filename}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{d.fileType}</span>
                  </td>
                  <td className="px-3 py-3">
                    <VerdictBadge verdict={d.verdict} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${d.verdict === "fake" ? "bg-red-500" : d.verdict === "real" ? "bg-green-500" : "bg-yellow-500"}`}
                          style={{ width: `${d.confidenceScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{d.confidenceScore.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] font-mono text-muted-foreground">{formatBytes(d.fileSize)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] font-mono text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/detection/${d.id}`}>
                      <button className="text-muted-foreground hover:text-primary transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-mono">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
