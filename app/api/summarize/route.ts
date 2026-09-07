import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are an expert editor for a modern blog. Provide a concise, engaging summary of the following article text.
      Focus on the key takeaways and main points. Keep it under 100 words. Make it readable as if you are speaking it directly to the user.
      
      Article Text:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Gemini summarization error:", error);
    
    let errorMessage = "Failed to generate summary";
    if (error.status === 503 || error.message?.includes("503") || error.message?.includes("Service Unavailable")) {
        errorMessage = "This model is currently experiencing high demand. Please try again later.";
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: error.status === 503 ? 503 : 500 }
    );
  }
}
