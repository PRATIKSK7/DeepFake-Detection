import { Router } from "express";
import { db } from "@workspace/db";
import { modelsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const models = await db.select().from(modelsTable).orderBy(desc(modelsTable.weight));
  res.json({ models });
});

export default router;
