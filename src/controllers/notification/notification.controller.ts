import { Request, Response } from "express";
import Notification from "../../models/notification.model";
import { io } from "../../app"; // Import the existing io instance
import { checkUserIsExist } from "../profile/profile.controller";
import httpResponse from "../../utils/httpResponse";

// Get notifications for the authenticated user
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    // Pagination and Search
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const userExist = await checkUserIsExist(userId!, req, res);
    if (!userExist) {
      return; // Exit early if user does not exist
    }

    const totalCount = await Notification.countDocuments({ userId })

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));;
    const validPage = Math.min(Math.max(1, page), totalPages);
    const skip = (validPage - 1) * limit;

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    return httpResponse(req, res, 200, "Notification fetched successfully", {
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages
      },
      notifications
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Mark a notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    // const { id } = req.params;
    const userId = req.user?.userId;
    const updatedNotification = await Notification.findByIdAndUpdate(userId, { isRead: true }, { new: true });
    console.log("Marking notification as read:", updatedNotification);
    if (!updatedNotification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.status(200).json({ message: "Notification marked as read", notification: updatedNotification });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Send a notification via API
export const sendNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { message } = req.body;
    console.log("Sending notification to user:", userId, "Message:", message);
    if (!userId) {
      console.error("Missing userId. Check authMiddleware.");
      res.status(400).json({ error: "Invalid request: Missing user ID" });
      return;
    }

    if (!message) {
      console.error("Missing message in request body.");
      res.status(400).json({ error: "Invalid request: Message is required" });
      return;
    }


    await sendNotificationToUser(userId as string, message);
    res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Function to send notifications via Socket.IO
export const sendNotificationToUser = async (userId: string, message: string): Promise<void> => {
  try {
    const notification = new Notification({ userId, message });
    await notification.save();

    io.to('user_' + userId).emit("receive_notification", { message });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
