import { Router, type IRouter } from "express";
import { csrfProtection, sanitizeInput } from "../lib/security";
import { validateRouteParams } from "../lib/validation";
import healthRouter from "./health";
import authRouter from "./auth";
import messagesRouter from "./messages";
import duasRouter from "./duas";
import eventsRouter from "./events";
import calendarEventsRouter from "./calendar-events";
import checkinsRouter from "./checkins";
import tasksRouter from "./tasks";
import milestonesRouter from "./milestones";
import secretNotesRouter from "./secret-notes";
import callRouter from "./call";
import profileRouter from "./profile";
import presenceRouter from "./presence";
import imagesRouter from "./images";
import notificationsRouter from "./notifications";
import twoFactorRouter from "./twoFactor";
import reactionsRouter from "./reactions";
import typingRouter from "./typing";
import readReceiptsRouter from "./readReceipts";
import forwardRouter from "./forward";
import editRouter from "./edit";
import pinRouter from "./pin";
import scheduleRouter from "./schedule";
import mediaRouter from "./media";
import hiddenMessagesRouter from "./hidden-messages";
import exportRouter from "./export";
import coupleSyncRouter from "./couple-sync";
import libraryRouter from "./library";
import doodleRouter from "./doodle";
import storiesRouter from "./stories";
import avatarNotesRouter from "./avatar-notes";

const router: IRouter = Router();

// Apply security middlewares to all API routes
router.use(sanitizeInput);
router.use(csrfProtection);

// Apply parameter validation to all routes with parameters
router.use(validateRouteParams({}));

router.use(healthRouter);
router.use(eventsRouter);
router.use(calendarEventsRouter);
router.use(checkinsRouter);
router.use(tasksRouter);
router.use(milestonesRouter);
router.use(secretNotesRouter);
router.use(presenceRouter);
router.use(profileRouter);
router.use(authRouter);
router.use(messagesRouter);
router.use(duasRouter);
router.use(callRouter);
router.use(imagesRouter);
router.use(notificationsRouter);
router.use(twoFactorRouter);
router.use(reactionsRouter);
router.use(typingRouter);
router.use(readReceiptsRouter);
router.use(forwardRouter);
router.use(editRouter);
router.use(pinRouter);
router.use(scheduleRouter);
router.use(mediaRouter);
router.use(hiddenMessagesRouter);
router.use(exportRouter);
router.use(coupleSyncRouter);
router.use(libraryRouter);
router.use("/doodle", doodleRouter);
router.use(storiesRouter);
router.use(avatarNotesRouter);

export default router;
