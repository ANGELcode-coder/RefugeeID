import { Router, type IRouter } from "express";
import healthRouter from "./health";
import faceRouter from "./face";
import credentialsRouter from "./credentials";

const router: IRouter = Router();

router.use(healthRouter);
router.use(faceRouter);
router.use(credentialsRouter);

export default router;
