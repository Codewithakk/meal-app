// import openai from "../config/openaiConfig";

// export const getAIResponse = async (message: string): Promise<string> => {
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo", // or "gpt-4"
//       messages: [{ role: "user", content: message }],
//     });

//     return response.choices[0]?.message?.content || "I couldn't process your request.";
//   } catch (error) {
//     console.error("Error generating AI response:", error);
//     return "Sorry, something went wrong.";
//   }
// };

import together from "../config/smartMeal"; // Import Together AI configuration

export const getAIResponse = async (message: string): Promise<string> => {
  try {
    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", // Adjust model as needed
      messages: [{ role: "user", content: message }],
    });

    return response?.choices?.[0]?.message?.content ?? "I couldn't process your request.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Sorry, something went wrong.";
  }
};
