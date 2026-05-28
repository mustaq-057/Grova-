import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import messagesRouter from "./messages";
import duasRouter from "./duas";
import eventsRouter from "./events";
import callRouter from "./call";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(profileRouter);
router.use(authRouter);
router.use(messagesRouter);
router.use(duasRouter);
router.use(callRouter);

export default router;
