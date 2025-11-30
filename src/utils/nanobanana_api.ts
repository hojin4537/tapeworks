/**
 * Google Generative AI (Imagen) integration
 * Handles AI image generation requests using Google AI Studio API key
 */

// Support both the old variable (for backward compatibility/user ease) and a new one
const API_KEY = import.meta.env.VITE_NANOBANANA_API_KEY || import.meta.env.VITE_GOOGLE_AI_API_KEY || '';

// Gemini model endpoint for image generation
// Using gemini-3-pro-image-preview as per the user's guide
const API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

export interface GenerateImageParams {
  prompt: string;
  logoImage?: string | null;
  referenceImage?: string | null;
}

/**
 * Generate an image using Google Gemini 2.0 Flash API (Free Tier)
 */
export async function generateImage(params: GenerateImageParams): Promise<string> {
  if (!API_KEY) {
    throw new Error('API key is not configured. Please set VITE_NANOBANANA_API_KEY or VITE_GOOGLE_AI_API_KEY in your .env file.');
  }

  try {
    // Prepare request body for Gemini generateContent
    // Using the configuration for image generation as per the user's guide
    const parts: any[] = [
      { text: `Create a high quality, square album cover art for a music cassette tape J-Card. The style should be: ${params.prompt}` }
    ];

    // Helper to process base64 images
    const processBase64Image = (base64String: string) => {
      const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
      return {
        inlineData: {
          mimeType: "image/png",
          data: base64Data
        }
      };
    };

    if (params.logoImage) {
      parts.push(processBase64Image(params.logoImage));
      parts[0].text += " Use the attached image as a logo or main element.";
    }

    if (params.referenceImage) {
      parts.push(processBase64Image(params.referenceImage));
      parts[0].text += " Use the attached image as a style reference or composition guide.";
    }

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } // Optional, but sometimes required structure
        }
      }
    };

    const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Parse Gemini response
    // Expected format: candidates[0].content.parts[0].inlineData.data (base64)
    // OR candidates[0].content.parts[0].text (if it refused and returned text)

    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error('No candidates returned');

    const part = candidate.content?.parts?.[0];
    if (!part) throw new Error('No content parts returned');

    if (part.inlineData && part.inlineData.data) {
      return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
    }

    // If we got text back instead of an image, it might be a refusal or error description
    if (part.text) {
      console.warn('Gemini returned text instead of image:', part.text);
      throw new Error(`Model returned text: ${part.text.substring(0, 100)}...`);
    }

    throw new Error('Failed to parse image from API response');

  } catch (error) {
    console.error('Image generation error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate image');
  }
}

// Keep these for compatibility if imported elsewhere, but they are no longer used
export interface TaskResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}
export async function checkTaskStatus(taskId: string): Promise<TaskResponse> {
  return { task_id: taskId, status: 'completed' };
}

