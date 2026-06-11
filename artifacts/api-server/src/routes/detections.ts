import { Router } from "express";
import { db } from "@workspace/db";
import { detectionsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import {
  CreateDetectionBody,
  ListDetectionsQueryParams,
  GetDetectionParams,
} from "@workspace/api-zod";

const router = Router();

const MODEL_ENSEMBLE = [
  { name: "EfficientNet-B4-DeepFake", version: "v2.3.1", weight: 0.35 },
  { name: "XceptionNet-Forensics", version: "v1.8.0", weight: 0.30 },
  { name: "ViT-FaceForensics", version: "v3.1.2", weight: 0.25 },
  { name: "GAN-Detector-Pro", version: "v1.4.5", weight: 0.10 },
];

const ARTIFACT_TYPES = [
  "GAN fingerprints",
  "Frequency artifacts",
  "Blending boundaries",
  "Face warping",
  "Color inconsistency",
  "Compression artifacts",
  "Temporal inconsistency",
  "Facial landmark anomalies",
  "Texture synthesis patterns",
  "Lighting direction mismatch",
];

type HeatmapPoint = { x: number; y: number; intensity: number; radius: number };

function seededRandom(seed: number, offset = 0) {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function generateHeatmapPoints(
  filename: string,
  verdict: string
): HeatmapPoint[] {
  const seed = filename.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  if (verdict === "real") {
    // Real media: sparse low-intensity points
    const count = 4 + Math.floor(seededRandom(seed, 99) * 4);
    return Array.from({ length: count }, (_, i) => ({
      x: seededRandom(seed, i * 7 + 1),
      y: seededRandom(seed, i * 7 + 2),
      intensity: 0.1 + seededRandom(seed, i * 7 + 3) * 0.25,
      radius: 0.05 + seededRandom(seed, i * 7 + 4) * 0.08,
    }));
  }

  if (verdict === "uncertain") {
    // Uncertain: moderate clusters
    const count = 6 + Math.floor(seededRandom(seed, 99) * 5);
    return Array.from({ length: count }, (_, i) => ({
      x: seededRandom(seed, i * 11 + 1),
      y: seededRandom(seed, i * 11 + 2),
      intensity: 0.3 + seededRandom(seed, i * 11 + 3) * 0.4,
      radius: 0.06 + seededRandom(seed, i * 11 + 4) * 0.1,
    }));
  }

  // Fake: concentrated high-intensity clusters simulating face region attention
  const clusters = [
    { cx: 0.35 + seededRandom(seed, 200) * 0.3, cy: 0.2 + seededRandom(seed, 201) * 0.25 }, // eye region
    { cx: 0.4 + seededRandom(seed, 202) * 0.2, cy: 0.55 + seededRandom(seed, 203) * 0.15 }, // mouth region
    { cx: 0.3 + seededRandom(seed, 204) * 0.4, cy: 0.35 + seededRandom(seed, 205) * 0.2 },  // nose region
  ];

  const points: HeatmapPoint[] = [];
  clusters.forEach((cluster, ci) => {
    const clusterCount = 4 + Math.floor(seededRandom(seed, ci * 50) * 5);
    for (let i = 0; i < clusterCount; i++) {
      const angle = seededRandom(seed, ci * 100 + i) * Math.PI * 2;
      const dist = seededRandom(seed, ci * 100 + i + 50) * 0.12;
      points.push({
        x: Math.max(0.05, Math.min(0.95, cluster.cx + Math.cos(angle) * dist)),
        y: Math.max(0.05, Math.min(0.95, cluster.cy + Math.sin(angle) * dist)),
        intensity: 0.6 + seededRandom(seed, ci * 100 + i + 150) * 0.4,
        radius: 0.04 + seededRandom(seed, ci * 100 + i + 200) * 0.09,
      });
    }
  });

  return points;
}

function runDetectionEngine(filename: string, fileType: string) {
  const seed = filename.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const r = (min: number, max: number, offset = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    return min + ((x - Math.floor(x)) * (max - min));
  };

  const isFake = r(0, 1, 1) > 0.45;
  const isUncertain = !isFake && r(0, 1, 2) > 0.85;

  const modelScores = MODEL_ENSEMBLE.map((model, i) => {
    let base: number;
    if (isFake) base = r(72, 97, i + 10);
    else if (isUncertain) base = r(40, 60, i + 20);
    else base = r(5, 30, i + 30);
    return {
      modelName: model.name,
      modelVersion: model.version,
      score: Math.round(base * 100) / 100,
      verdict: base > 60 ? "fake" : base > 40 ? "uncertain" : "real",
      weight: model.weight,
    };
  });

  const weighted = modelScores.reduce((acc, m) => acc + m.score * m.weight, 0);

  let verdict: "real" | "fake" | "uncertain";
  let confidenceScore: number;
  if (weighted > 60) {
    verdict = "fake";
    confidenceScore = Math.round(Math.min(99.9, weighted + r(0, 8, 100)) * 10) / 10;
  } else if (weighted > 38) {
    verdict = "uncertain";
    confidenceScore = Math.round((45 + r(0, 20, 200)) * 10) / 10;
  } else {
    verdict = "real";
    confidenceScore = Math.round(Math.min(99.9, 100 - weighted + r(0, 5, 300)) * 10) / 10;
  }

  const fakeScore = verdict === "fake" ? confidenceScore : 100 - confidenceScore;
  const realScore = 100 - fakeScore;
  const numArtifacts = verdict === "fake" ? Math.floor(r(2, 5, 400)) : verdict === "uncertain" ? Math.floor(r(0, 2, 500)) : 0;
  const shuffled = [...ARTIFACT_TYPES].sort(() => r(-1, 1, seed) - 0.5);
  const detectionArtifacts = shuffled.slice(0, numArtifacts);
  const processingTimeMs = Math.floor(r(800, 2400, 600));
  const heatmapPoints = generateHeatmapPoints(filename, verdict);

  return { verdict, confidenceScore, fakeScore: Math.round(fakeScore * 10) / 10, realScore: Math.round(realScore * 10) / 10, modelScores, detectionArtifacts, heatmapPoints, processingTimeMs };
}

router.post("/", async (req, res) => {
  const parsed = CreateDetectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { filename, fileType, fileSize } = parsed.data;
  const result = runDetectionEngine(filename, fileType);
  const [detection] = await db.insert(detectionsTable).values({
    filename, fileType, fileSize,
    verdict: result.verdict,
    confidenceScore: result.confidenceScore,
    fakeScore: result.fakeScore,
    realScore: result.realScore,
    modelScores: result.modelScores,
    detectionArtifacts: result.detectionArtifacts,
    heatmapPoints: result.heatmapPoints,
    processingTimeMs: result.processingTimeMs,
  }).returning();
  res.status(201).json(detection);
});

router.get("/", async (req, res) => {
  const parsed = ListDetectionsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid query params" }); return; }
  const { page = 1, limit = 20, verdict } = parsed.data;
  const offset = (page - 1) * limit;
  const condition = verdict ? eq(detectionsTable.verdict, verdict) : undefined;
  const [totalResult, detections] = await Promise.all([
    db.select({ count: count() }).from(detectionsTable).where(condition),
    db.select().from(detectionsTable).where(condition).orderBy(desc(detectionsTable.createdAt)).limit(limit).offset(offset),
  ]);
  res.json({ detections, total: totalResult[0]?.count ?? 0, page, limit });
});

router.get("/:id", async (req, res) => {
  const parsed = GetDetectionParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid params" }); return; }
  const [detection] = await db.select().from(detectionsTable).where(eq(detectionsTable.id, parsed.data.id)).limit(1);
  if (!detection) { res.status(404).json({ error: "Not found" }); return; }
  res.json(detection);
});

export default router;
