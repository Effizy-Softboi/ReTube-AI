import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface OptimizedContent {
  viralTitle: string;
  seoDescription: string;
  tags: string[];
  recreationPrompt: string;
  script: string;
}

export async function analyzeAndOptimize(title: string, description: string): Promise<OptimizedContent> {
  const prompt = `
    Analyze this YouTube video:
    Title: ${title}
    Description: ${description}

    1. Generate a viral title.
    2. Generate an SEO description.
    3. Generate 10 tags.
    4. Generate a detailed visual prompt for an AI video generator (Veo) to recreate the essence of this video without infringing copyright (unique characters, unique setting, but same vibe).
    5. Generate a short 30-second script for a voiceover that summarizes the video's value.

    Return as JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          viralTitle: { type: Type.STRING },
          seoDescription: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          recreationPrompt: { type: Type.STRING },
          script: { type: Type.STRING }
        },
        required: ["viralTitle", "seoDescription", "tags", "recreationPrompt", "script"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function recreateAudio(script: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say professionally: ${script}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Audio recreation error:", error);
    return null;
  }
}

export async function startVideoRecreation(prompt: string, thumbnailBase64?: string) {
  const config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: '16:9'
  };

  const payload: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config
  };

  if (thumbnailBase64) {
    payload.image = {
      imageBytes: thumbnailBase64,
      mimeType: 'image/jpeg'
    };
  }

  return await ai.models.generateVideos(payload);
}

export async function pollVideoStatus(operation: any) {
  return await ai.operations.getVideosOperation({ operation });
}
