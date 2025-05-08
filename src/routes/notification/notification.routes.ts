import express from "express";
import { getNotifications, markAsRead, sendNotification } from "../../controllers/notification/notification.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.put("/", authMiddleware, markAsRead);
router.post("/send", authMiddleware, sendNotification);

export default router;
