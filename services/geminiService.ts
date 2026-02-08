
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Always use named parameter for apiKey and obtain it from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ImportResponse {
  lessons: any[];
  sources: { title: string; uri: string }[];
  trimestreInfo?: {
    year: string;
    quarter: string;
    theme: string;
    commentator: string;
  };
}

export const askStudyAssistant = async (question: string, context: string, systemInstruction?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
        Contexto da lição: "${context}"
        Pergunta: "${question}"
      `,
      config: {
        systemInstruction: systemInstruction || "Você é um assistente teológico erudito. Responda com profundidade e rigor bíblico, citando referências quando apropriado."
      }
    });
    return response.text;
  } catch (error) {
    console.error(error);
    throw new Error("Erro na assistência IA.");
  }
};

export const searchAndImportLessons = async (year: string, quarter: string): Promise<ImportResponse> => {
  try {
    const prompt = `Pesquise no Google pelo sumário das lições bíblicas CPAD do ${quarter} de ${year}.
    Encontre a lista de lições e as informações gerais do trimestre.
    Extraia o conteúdo seguindo RIGOROSAMENTE esta estrutura JSON:
    
    {
      "trimestreInfo": { 
        "year": "${year}", 
        "quarter": "${quarter.replace(/\D/g, '')}", 
        "theme": "Título do Trimestre", 
        "commentator": "Nome do Comentarista" 
      },
      "lessons": [
        {
          "title": "Título da Lição",
          "summary": "Breve resumo da lição",
          "theme": "Tema da lição se houver",
          "content": "Resumo detalhado ou introdução da lição"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.map((chunk: any) => ({
      title: chunk.web?.title || 'Fonte',
      uri: chunk.web?.uri || ''
    })).filter(s => s.uri !== '');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Não foi possível encontrar o sumário.");
    
    const data = JSON.parse(jsonMatch[0].trim());
    return { ...data, sources };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const scrapeLessonsFromUrl = async (url: string): Promise<ImportResponse> => {
  try {
    const prompt = `Analise a página ${url}. 
    Esta é uma lição bíblica da CPAD. Extraia TODO o conteúdo seguindo RIGOROSAMENTE esta estrutura JSON:
    
    {
      "trimestreInfo": { "year": "1993", "quarter": "3", "theme": "Título do Trimestre", "commentator": "Nome" },
      "lessons": [
        {
          "title": "Título Completo da Lição",
          "studyDate": "Data da lição",
          "goldText": "Texto Áureo completo",
          "practicalTruth": "Verdade Prática completa",
          "dailyReading": [ { "day": "Segunda", "reference": "Lv 11.1", "theme": "Título" } ],
          "biblicalText": "Texto Bíblico Básico completo com referências",
          "objectives": ["Objetivo 1", "Objetivo 2"],
          "introduction": "Texto da introdução",
          "content": "COMENTÁRIO COMPLETO formatado em Markdown",
          "conclusion": "Texto da conclusão",
          "questionnaire": [ { "question": "Pergunta 1" } ]
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Falha ao processar lição.");
    
    return { ...JSON.parse(jsonMatch[0].trim()), sources: [] };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const generateLessonAudio = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Narração calma e solene: ${text.slice(0, 5000)}` }] }],
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
        } 
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) {
    console.error(e);
    return null;
  }
};
