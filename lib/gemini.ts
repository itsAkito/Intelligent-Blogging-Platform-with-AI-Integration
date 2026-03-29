import OpenAI from 'openai';
import { geminiRequestQueue } from './request-queue';

// Initialize OpenAI client with Gemini endpoint
// Uses OpenAI-compatible API with Gemini models
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not configured in environment variables. Please add it to .env.local');
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

type ModelType = 'flash' | 'pro' | 'thinking' | 'default';

// Get model name based on preference
function getModelName(preference: ModelType = 'default'): string {
  switch (preference) {
    case 'pro':
    case 'thinking':
      return 'gemini-2.0-pro'; // Best quality for editorial content
    case 'flash':
      return 'gemini-2.0-flash'; // Faster, cheaper alternative
    case 'default':
    default:
      return 'gemini-2.0-flash'; // Most stable for free tier in 2026
  }
}

// Get fallback model name
function getFallbackModelName(): string {
  return 'gemini-2.5-pro'; // Fallback option
}

export async function generateBlogContent(
  prompt: string,
  tone: string = 'professional',
  modelPreference: ModelType = 'default'
) {
  const systemPrompt = `You are an expert AI blog writer specializing in creating comprehensive, well-researched editorial content.
    
IMPORTANT REQUIREMENTS:
- Write a COMPLETE blog post of 1000-1500 words minimum
- Structure with clear markdown headings (H2 for sections, H3 for subsections)
- Include an engaging introduction (150-200 words)
- Provide 4-6 substantial body sections with detailed information
- Add practical examples, tips, or case studies where relevant
- End with a strong conclusion (100-150 words)
- Use proper markdown formatting with **bold** and *italics* for emphasis
- Include a call-to-action or summary in the conclusion

The tone should be ${tone}. Be comprehensive, informative, and engaging.
Format the entire response in markdown with proper structure.`;

  const modelName = getModelName(modelPreference);

  // Queue the request with automatic rate limiting and retry
  return geminiRequestQueue.enqueue(async () => {
    try {
      console.log(`🚀 Queued: Generating blog content with ${modelName}...`);
      
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Write about: ${prompt}` },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        top_p: 0.95,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated');
      }

      console.log(`✅ Successfully generated blog content`);
      return content;
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.warn(`⚠️ ${modelName} failed, attempting fallback...`, errorMsg);

      // Try fallback model
      try {
        const fallbackModel = getFallbackModelName();
        console.log(`🔄 Using ${fallbackModel} as fallback...`);

        const response = await openai.chat.completions.create({
          model: fallbackModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Write about: ${prompt}` },
          ],
          temperature: 0.7,
          max_tokens: 8192,
          top_p: 0.95,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No content from fallback model');
        }

        console.log(`✅ Successfully generated with fallback model`);
        return content;
      } catch (fallbackError: any) {
        console.error('❌ Fallback model also failed:', fallbackError);

        // Check for API key issues
        if (errorMsg.includes('API key') || errorMsg.includes('403') || errorMsg.includes('401')) {
          throw new Error(`❌ Gemini API Key Issue: Your API key may be invalid or not configured.
      
**Solution:** Add this to your .env.local file:
GEMINI_API_KEY=your_api_key_here

Get your free API key: https://aistudio.google.com/app/apikey`);
        }

        throw new Error(`Failed to generate blog content: ${fallbackError.message || errorMsg}`);
      }
    }
  }, 'high'); // High priority for blog content
}

export async function generateBlogTitle(
  topic: string,
  modelPreference: ModelType = 'default'
) {
  const modelName = getModelName(modelPreference);

  return geminiRequestQueue.enqueue(async () => {
    try {
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: `Generate 5 compelling blog post titles for the topic: "${topic}". Return only the titles, one per line.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No titles generated');
      }

      const titles = content.split('\n').filter((t: string) => t.trim());
      return titles;
    } catch (error: any) {
      console.warn(`${modelName} title generation failed, trying fallback...`, error.message);
      try {
        const fallbackModel = getFallbackModelName();
        const response = await openai.chat.completions.create({
          model: fallbackModel,
          messages: [
            {
              role: 'user',
              content: `Generate 5 compelling blog post titles for the topic: "${topic}". Return only the titles, one per line.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No titles from fallback');
        }

        const titles = content.split('\n').filter((t: string) => t.trim());
        return titles;
      } catch (fallbackError: any) {
        throw new Error(
          `Failed to generate blog titles: ${fallbackError.message || error.message}`
        );
      }
    }
  }, 'normal'); // Normal priority for titles
}

export async function generateBlogExcerpt(
  content: string,
  modelPreference: ModelType = 'default'
) {
  const modelName = getModelName(modelPreference);

  return geminiRequestQueue.enqueue(async () => {
    try {
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: `Generate a compelling excerpt (2-3 sentences) for this blog post:\n\n${content.substring(0, 500)}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const excerpt = response.choices[0]?.message?.content;
      if (!excerpt) {
        throw new Error('No excerpt generated');
      }

      return excerpt;
    } catch (error: any) {
      console.error('Error generating blog excerpt:', error.message);
      throw new Error(`Failed to generate blog excerpt: ${error.message}`);
    }
  }, 'normal'); // Normal priority
}

/**
 * Generate a synthetic insight (pro-tip) from blog content
 * Used to create engaging callout boxes or highlights in the UI
 */
export async function generateSyntheticInsight(
  content: string,
  modelPreference: ModelType = 'default'
) {
  const modelName = getModelName(modelPreference);

  return geminiRequestQueue.enqueue(async () => {
    try {
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: `Based on this blog post content, generate ONE "Synthetic Insight" or "Pro Tip" (maximum 20 words).
Focus on practical, actionable advice or an engagement hook for the reader. Keep it punchy and memorable.

Content: ${content.substring(0, 800)}

Return only the insight, no additional text or formatting.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const insight = response.choices[0]?.message?.content?.trim();
      if (!insight) {
        throw new Error('No insight generated');
      }

      return insight;
    } catch (error: any) {
      console.error('Error generating synthetic insight:', error.message);
      throw new Error(`Failed to generate synthetic insight: ${error.message}`);
    }
  }, 'low'); // Low priority
}

/**
 * Stream blog content generation for better real-time UX
 * Allows the frontend to display content as it's being generated
 */
export async function generateBlogContentStream(
  prompt: string,
  tone: string = 'professional',
  modelPreference: ModelType = 'default'
) {
  const systemPrompt = `You are an expert AI blog writer specializing in creating comprehensive, well-researched blog posts.
    
IMPORTANT REQUIREMENTS:
- Write a COMPLETE blog post of 1000-1500 words minimum
- Structure with clear markdown headings (H2 for sections, H3 for subsections)
- Include an engaging introduction (150-200 words)
- Provide 4-6 substantial body sections with detailed information
- Add practical examples, tips, or case studies where relevant
- End with a strong conclusion (100-150 words)
- Use proper markdown formatting with **bold** and *italics* for emphasis
- Include a call-to-action or summary in the conclusion

The tone should be ${tone}. Be comprehensive, informative, and engaging.
Format the entire response in markdown with proper structure.`;

  return geminiRequestQueue.enqueue(async () => {
    try {
      console.log(`🚀 Queued: Starting streaming content generation with ${getModelName(modelPreference)}...`);

      const stream = await openai.chat.completions.create({
        model: getModelName(modelPreference),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Write about: ${prompt}` },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        top_p: 0.95,
        stream: true,
      });

      console.log('✅ Stream started successfully');

      return stream;
    } catch (error: any) {
      console.error('Error starting stream:', error.message);
      throw new Error(`Failed to start content stream: ${error.message}`);
    }
  }, 'high'); // High priority for streaming
}
