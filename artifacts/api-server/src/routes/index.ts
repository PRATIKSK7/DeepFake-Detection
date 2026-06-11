import { Router, type IRouter } from "express";
import healthRouter from "./health";
import detectionsRouter from "./detections";
import analyticsRouter from "./analytics";
import modelsRouter from "./models";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/detections", detectionsRouter);
router.use("/analytics", analyticsRouter);
router.use("/models", modelsRouter);

export default router;
