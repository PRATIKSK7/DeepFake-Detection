import { pgTable, text, serial, integer, real, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const detectionsTable = pgTable("detections", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  verdict: text("verdict").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  fakeScore: real("fake_score").notNull(),
  realScore: real("real_score").notNull(),
  modelScores: json("model_scores").notNull().$type<Array<{
    modelName: string;
    modelVersion: string;
    score: number;
    verdict: string;
    weight: number;
  }>>(),
  detectionArtifacts: json("detection_artifacts").notNull().$type<string[]>(),
  heatmapPoints: json("heatmap_points").$type<Array<{x: number; y: number; intensity: number; radius: number}>>().default([]),
  processingTimeMs: integer("processing_time_ms").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDetectionSchema = createInsertSchema(detectionsTable).omit({ id: true, createdAt: true });
export type InsertDetection = z.infer<typeof insertDetectionSchema>;
export type Detection = typeof detectionsTable.$inferSelect;

export const modelsTable = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  weight: real("weight").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertModelSchema = createInsertSchema(modelsTable).omit({ id: true, createdAt: true });
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof modelsTable.$inferSelect;

export const dailyStatsTable = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  totalAnalyzed: integer("total_analyzed").notNull().default(0),
  fakeCount: integer("fake_count").notNull().default(0),
  realCount: integer("real_count").notNull().default(0),
  uncertainCount: integer("uncertain_count").notNull().default(0),
  avgConfidence: real("avg_confidence").notNull().default(0),
});
