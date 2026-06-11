import { Router } from "express";
import { db } from "@workspace/db";
import { detectionsTable, modelsTable } from "@workspace/db";
import { eq, desc, count, avg, sql } from "drizzle-orm";
import { GetDetectionTrendsQueryParams, GetRecentActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/summary", async (req, res) => {
  const all = await db.select().from(detectionsTable);

  const totalAnalyzed = all.length;
  const fakeDetected = all.filter(d => d.verdict === "fake").length;
  const realDetected = all.filter(d => d.verdict === "real").length;
  const uncertainDetected = all.filter(d => d.verdict === "uncertain").length;
  const averageConfidence = totalAnalyzed > 0
    ? Math.round((all.reduce((acc, d) => acc + d.confidenceScore, 0) / totalAnalyzed) * 10) / 10
    : 0;
  const fakePercentage = totalAnalyzed > 0
    ? Math.round((fakeDetected / totalAnalyzed) * 1000) / 10
    : 0;
  const averageProcessingMs = totalAnalyzed > 0
    ? Math.round(all.reduce((acc, d) => acc + d.processingTimeMs, 0) / totalAnalyzed)
    : 0;
  const totalImagesAnalyzed = all.filter(d => d.fileType === "image").length;
  const totalVideosAnalyzed = all.filter(d => d.fileType === "video").length;

  res.json({
    totalAnalyzed,
    fakeDetected,
    realDetected,
    uncertainDetected,
    averageConfidence,
    fakePercentage,
    averageProcessingMs,
    totalImagesAnalyzed,
    totalVideosAnalyzed,
  });
});

router.get("/trends", async (req, res) => {
  const parsed = GetDetectionTrendsQueryParams.safeParse(req.query);
  const days = parsed.success ? (parsed.data.days ?? 30) : 30;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const all = await db.select().from(detectionsTable)
    .where(sql`${detectionsTable.createdAt} >= ${cutoff.toISOString()}`);

  const byDate = new Map<string, { totalAnalyzed: number; fakeCount: number; realCount: number; uncertainCount: number; totalConfidence: number }>();

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split("T")[0];
    byDate.set(dateStr, { totalAnalyzed: 0, fakeCount: 0, realCount: 0, uncertainCount: 0, totalConfidence: 0 });
  }

  for (const detection of all) {
    const dateStr = detection.createdAt.toISOString().split("T")[0];
    const entry = byDate.get(dateStr);
    if (entry) {
      entry.totalAnalyzed++;
      entry.totalConfidence += detection.confidenceScore;
      if (detection.verdict === "fake") entry.fakeCount++;
      else if (detection.verdict === "real") entry.realCount++;
      else entry.uncertainCount++;
    }
  }

  const trends = Array.from(byDate.entries()).map(([date, data]) => ({
    date,
    totalAnalyzed: data.totalAnalyzed,
    fakeCount: data.fakeCount,
    realCount: data.realCount,
    uncertainCount: data.uncertainCount,
    avgConfidence: data.totalAnalyzed > 0 ? Math.round((data.totalConfidence / data.totalAnalyzed) * 10) / 10 : 0,
  }));

  res.json({ trends, days });
});

router.get("/model-performance", async (req, res) => {
  const allDetections = await db.select().from(detectionsTable);

  const modelStats = new Map<string, {
    name: string;
    version: string;
    scores: number[];
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
    inferenceTimes: number[];
  }>();

  for (const detection of allDetections) {
    for (const ms of detection.modelScores as Array<{ modelName: string; modelVersion: string; score: number; verdict: string; weight: number }>) {
      const key = ms.modelName;
      if (!modelStats.has(key)) {
        modelStats.set(key, {
          name: ms.modelName,
          version: ms.modelVersion,
          scores: [],
          truePositives: 0,
          falsePositives: 0,
          trueNegatives: 0,
          falseNegatives: 0,
          inferenceTimes: [],
        });
      }
      const stat = modelStats.get(key)!;
      stat.scores.push(ms.score);
      stat.inferenceTimes.push(detection.processingTimeMs * ms.weight);

      const predicted = ms.verdict;
      const actual = detection.verdict;

      if (predicted === "fake" && actual === "fake") stat.truePositives++;
      else if (predicted === "fake" && actual !== "fake") stat.falsePositives++;
      else if (predicted !== "fake" && actual !== "fake") stat.trueNegatives++;
      else if (predicted !== "fake" && actual === "fake") stat.falseNegatives++;
    }
  }

  const models = Array.from(modelStats.values()).map(stat => {
    const tp = stat.truePositives;
    const fp = stat.falsePositives;
    const tn = stat.trueNegatives;
    const fn = stat.falseNegatives;
    const total = tp + fp + tn + fn;
    const accuracy = total > 0 ? Math.round(((tp + tn) / total) * 1000) / 10 : 0;
    const precision = (tp + fp) > 0 ? Math.round((tp / (tp + fp)) * 1000) / 10 : 0;
    const recall = (tp + fn) > 0 ? Math.round((tp / (tp + fn)) * 1000) / 10 : 0;
    const f1Score = (precision + recall) > 0
      ? Math.round((2 * precision * recall / (precision + recall)) * 10) / 10
      : 0;
    const falsePositiveRate = (fp + tn) > 0 ? Math.round((fp / (fp + tn)) * 1000) / 10 : 0;
    const falseNegativeRate = (fn + tp) > 0 ? Math.round((fn / (fn + tp)) * 1000) / 10 : 0;
    const avgInferenceMs = stat.inferenceTimes.length > 0
      ? Math.round(stat.inferenceTimes.reduce((a, b) => a + b, 0) / stat.inferenceTimes.length)
      : 0;

    return {
      modelName: stat.name,
      modelVersion: stat.version,
      accuracy,
      precision,
      recall,
      f1Score,
      falsePositiveRate,
      falseNegativeRate,
      avgInferenceMs,
      totalInferences: stat.scores.length,
      status: "active" as const,
    };
  });

  res.json({ models });
});

router.get("/recent-activity", async (req, res) => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const activity = await db.select({
    id: detectionsTable.id,
    filename: detectionsTable.filename,
    verdict: detectionsTable.verdict,
    confidenceScore: detectionsTable.confidenceScore,
    fileType: detectionsTable.fileType,
    createdAt: detectionsTable.createdAt,
  }).from(detectionsTable)
    .orderBy(desc(detectionsTable.createdAt))
    .limit(limit);

  res.json({ activity });
});

export default router;
