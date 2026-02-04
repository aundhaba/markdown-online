import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateNoteContent = async (
  prompt: string,
  currentContext: string,
  mode: 'continue' | 'summarize' | 'improve'
): Promise<string> => {
  const client = getAIClient();
  if (!client) return "Error: API Key missing.";

  const systemInstructions = {
    continue: "You are a helpful writing assistant. Continue the text naturally based on the context provided. Return ONLY the new content.",
    summarize: "You are a concise editor. Summarize the provided text in a few bullet points.",
    improve: "You are a professional editor. Rewrite the provided text to correct grammar and improve flow while maintaining the original meaning. Return ONLY the improved text."
  };

  const finalPrompt = `
    Context/Current Text:
    "${currentContext}"

    User Instruction: ${prompt}
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        systemInstruction: systemInstructions[mode],
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please check your connection.";
  }
};
