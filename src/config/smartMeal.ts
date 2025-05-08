// import { OpenAI } from "openai";
// import dotenv from "dotenv";
// import { rateLimiterMongo } from "./rateLimiter";

// dotenv.config();

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// console.log("OpenAI API Key Loaded:", process.env.OPENAI_API_KEY);

// export const askOpenAI = async (prompt: string) => {
//   if (!rateLimiterMongo) {
//     throw new Error("Rate limiter not initialized.");
//   }

//   try {
//     await rateLimiterMongo.consume("openai_api", 1); // Deduct 1 request point

//     const response = await openai.chat.completions.create({
//       model: "gpt-4",
//       messages: [{ role: "user", content: prompt }],
//     });

//     return response;
//   } catch (error) {
//     if (error instanceof Error && error.message.includes("RateLimiterRes")) {
//       console.error("Rate limit exceeded. Please try again later.");
//       throw new Error("Too many requests. Please slow down.");
//     }
//     console.error("OpenAI API Error:", error);
//     throw error;
//   }
// };

// export default openai;

import Together from "together-ai";
import dotenv from "dotenv";
import { rateLimiterMongo } from "./rateLimiter";

dotenv.config(); // Load environment variables

const together = new Together({
  apiKey: process.env.AI_KEY, // Ensure API key is provided
});

console.log("Together AI API Initialized");

export const askTogetherAI = async (prompt: string) => {
  if (!rateLimiterMongo) {
    throw new Error("Rate limiter not initialized.");
  }

  try {
    await rateLimiterMongo.consume("together_ai", 1); // Deduct 1 request point

    const response = await together.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    });

    return response?.choices?.[0]?.message?.content ?? "No response received";
  } catch (error) {
    if (error instanceof Error && error.message.includes("RateLimiterRes")) {
      console.error("Rate limit exceeded. Please try again later.");
      throw new Error("Too many requests. Please slow down.");
    }
    console.error("Together AI Error:", error);
    throw error;
  }
};

export default together;
