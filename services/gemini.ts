
import { GoogleGenAI, Type } from "@google/genai";
import type { PendlyEvent } from '../types';

// The API key is assumed to be available in the execution environment as process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "The name or title of the event.",
    },
    date: {
      type: Type.STRING,
      description: "The date of the event in YYYY-MM-DD format. Infer this from the text. If no year is specified, assume the current or next upcoming year.",
    },
    time: {
      type: Type.STRING,
      description: "The time of the event in HH:MM (24-hour) format. If not specified, return an empty string.",
    },
    location: {
      type: Type.STRING,
      description: "The location of the event. If not specified, return an empty string.",
    },
    category: {
      type: Type.STRING,
      description: "The category of the event.",
      enum: ['holiday', 'meeting', 'work', 'travel', 'other'],
    },
    notes: {
      type: Type.STRING,
      description: "Any extra notes about the event. If not specified, return an empty string.",
    }
  },
  required: ["name", "date", "category"]
};


export const parseEventWithAI = async (prompt: string): Promise<Partial<Omit<PendlyEvent, 'id' | 'repetition' | 'displayDate'>>> => {
    const today = new Date().toISOString().split('T')[0];
    const systemInstruction = `You are an intelligent assistant for an event scheduling app. Your task is to parse user input and extract event details.
    The current date is ${today}.
    When the user provides relative dates like 'tomorrow', 'next Friday', or 'in 2 weeks', calculate the absolute date in 'YYYY-MM-DD' format.
    If a year is not specified, assume the upcoming date. For example, if today is 2024-11-15 and the user says 'December 25th', you should return '2024-12-25'. If the user says 'January 10th', you should return '2025-01-10'.
    For the category, choose the most appropriate one from the list: 'holiday', 'meeting', 'work', 'travel', 'other'. Default to 'other' if unsure.
    Return the extracted information in a structured JSON format according to the provided schema. If a value like time or location isn't mentioned, return an empty string for that field.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
             throw new Error("AI returned an empty response.");
        }
        const parsedData = JSON.parse(jsonText);
        
        return {
            name: parsedData.name || '',
            date: parsedData.date || '',
            time: parsedData.time || '',
            location: parsedData.location || '',
            category: parsedData.category || 'other',
            notes: parsedData.notes || '',
        };

    } catch (error) {
        console.error("Error parsing event with AI:", error);
        throw new Error("Не вдалося розпізнати подію. Будь ласка, заповніть деталі вручну.");
    }
};
