import { NextRequest, NextResponse } from 'next/server';
import { generateBlogContent, generateBlogTitle, generateBlogExcerpt, generateSyntheticInsight } from '@/lib/gemini';
import { retryWithExponentialBackoff, isRateLimitError, isConfigError } from '@/lib/retry';

/**
 * Non-streaming blog generation endpoint
 * Returns complete content in one response
 * Use /api/ai/generate/stream for real-time streaming
 */
export async function POST(_request: NextRequest) {
  try {
    const { prompt, topic, tone = 'professional', userId, includeInsight = false } = await _request.json();
    const finalPrompt = prompt || topic;

    if (!finalPrompt || !userId) {
      return NextResponse.json(
        { error: 'Topic and userId are required' },
        { status: 400 }
      );
    }

    // Check if Gemini API key is configured
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.includes('paste_your') || geminiKey.includes('your_new') || geminiKey.includes('your_api_key')) {
      return NextResponse.json(
        {
          error: 'Gemini API key is not configured',
          code: 'MISSING_API_KEY',
          setup: {
            service: 'Google Gemini (OpenAI-Compatible)',
            url: 'https://aistudio.google.com/app/apikey',
            instruction: 'Create a new API key and update GEMINI_API_KEY in .env.local'
          }
        },
        { status: 503 }
      );
    }

    try {
      console.log('Starting AI content generation for prompt:', finalPrompt.substring(0, 50));

      // Generate content with retry logic for rate limiting
      const content = await retryWithExponentialBackoff(
        () => generateBlogContent(finalPrompt, tone),
        { maxRetries: 2, initialDelayMs: 1000 }
      );

      const titles = await retryWithExponentialBackoff(
        () => generateBlogTitle(finalPrompt),
        { maxRetries: 2, initialDelayMs: 1000 }
      );

      const excerpt = await retryWithExponentialBackoff(
        () => generateBlogExcerpt(content),
        { maxRetries: 2, initialDelayMs: 1000 }
      );

      // Generate synthetic insight if requested
      let insight = null;
      if (includeInsight) {
        try {
          insight = await retryWithExponentialBackoff(
            () => generateSyntheticInsight(content),
            { maxRetries: 1, initialDelayMs: 500 }
          );
        } catch (insightError) {
          console.warn('Failed to generate insight:', insightError);
          // Don't fail the entire request if insight generation fails
        }
      }

      // Return first title as main title, rest as options
      const title = Array.isArray(titles) ? titles[0] : titles;

      return NextResponse.json(
        {
          content,
          title,
          titleOptions: Array.isArray(titles) ? titles : [titles],
          excerpt,
          insight: insight || null,
        },
        { status: 200 }
      );
    } catch (aiError: any) {
      console.error('Gemini API error details:', {
        message: aiError.message,
        status: aiError.status,
        code: aiError.code,
        stack: aiError.stack,
      });
      
      if (isRateLimitError(aiError)) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a few moments.', code: 'RATE_LIMIT' },
          { status: 429 }
        );
      }

      if (isConfigError(aiError)) {
        return NextResponse.json(
          { 
            error: 'API Key configuration error. Please check your GEMINI_API_KEY in .env.local.', 
            code: 'CONFIG_ERROR',
            details: aiError.message,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { 
          error: 'The AI model failed to generate content. This could be due to a configuration issue or a problem with the AI service.', 
          details: aiError.message,
          code: aiError.code || 'GENERATION_FAILED',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Generate route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
