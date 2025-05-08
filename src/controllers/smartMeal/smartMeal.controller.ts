import { Request, Response, NextFunction } from "express";
import { getAIResponse } from "../../services/chat.service";
import httpError from "../../utils/httpError";
import httpResponse from "../../utils/httpResponse";
import redisClient from "../../cache/redisClient"; // Import Redis Client
import { ChatHistory } from "../../models/smartmeal.model";
import mongoose from "mongoose";

// export const askQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//   try {
//     const { message } = req.body;

//     if (!message) {
//       return httpError(next, "Please provide a question.", req, 400);
//     }

//     // Check if the response already exists in Redis
//     const cachedResponse = await redisClient.get(message);
//     if (cachedResponse) {
//       return httpResponse(req, res, 200, "AI Response", { response: cachedResponse });
//     }

//     // If not in cache, generate AI response
//     const response: string = await getAIResponse(message);

//     // Store response in Redis with expiration of 1 hour (3600 seconds)
//     await redisClient.set(message, response, {
//       EX: 3600, // Set expiration time
//     });

//     return httpResponse(req, res, 200, "AI Response", { response });
//   } catch (error) {
//     httpError(next, error, req, 500);
//   }
// };


export const askQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId  = req.user?.userId;
    const { message } = req.body; // Get message & userId from request

    if (!message) {
      return httpError(next, "Please provide a question.", req, 400);
    }
    if (!userId) {
      return httpError(next, "User ID is required.", req, 400);
    }

    const cacheKey = `${userId}:${message}`; // Unique cache key per user

    // Check if the response already exists in Redis
    const cachedResponse = await redisClient.get(cacheKey);
    if (cachedResponse) {
      return httpResponse(req, res, 200, "AI Response", {
        userId,
        userPrompt: message,
        response: cachedResponse,
      });
    }

    // Generate AI response
    const response: string = await getAIResponse(message);

    await redisClient.set(cacheKey, JSON.stringify({ userId, userPrompt: message, response }), {
      EX: 3600, // 1 hour expiration
    });


    const chatHistory = new ChatHistory({ userId, userPrompt: message, response });
    await chatHistory.save(); // Store prompt-response pair with user ID

    return httpResponse(req, res, 200, "AI Response", {
      userId,
      userPrompt: message,
      response,
    });
  } catch (error) {
    httpError(next, error, req, 500);
  }
};


export const getUserMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return httpError(next, "User ID is required.", req, 400);
    }

    // Ensure userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return httpError(next, "Invalid User ID format.", req, 400);
    }

    // Fetch messages only if userId is valid
    const messages = await ChatHistory.find({ userId: userId.toString() }) // Ensure it's a string
      .select("userPrompt response createdAt feedback") // Select only the fields you need
      .sort({ createdAt: -1 })
      .lean();

    return httpResponse(req, res, 200, "User chat history retrieved successfully.", { userId, messages });
  } catch (error) {
    next(httpError(next, error instanceof Error ? error.message : "Server error", req, 500));
  }
};

export const addFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const messageId = req.params.messageId; // Get messageId from request parameters
    const { feedback } = req.body; // Get feedback and messageId from request

    if (!feedback || !messageId) {
      return httpError(next, "Feedback and message ID are required.", req, 400);
    }

    // Ensure messageId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return httpError(next, "Invalid Message ID format.", req, 400);
    }

    // Update the feedback in the database
    const updatedMessage = await ChatHistory.findByIdAndUpdate(
      messageId,
      { feedback },
      { new: true }
    );

    if (!updatedMessage) {
      return httpError(next, "Message not found.", req, 404);
    }

    return httpResponse(req, res, 200, "Feedback added successfully.", { updatedMessage });
  } catch (error) {
    next(httpError(next, error instanceof Error ? error.message : "Server error", req, 500));
  }
}