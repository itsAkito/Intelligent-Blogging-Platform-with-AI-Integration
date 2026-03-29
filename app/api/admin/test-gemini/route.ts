import { NextResponse } from 'next/server';
import { generateBlogContent } from '@/lib/gemini';

/**
 * GET /api/admin/test-gemini
 * Test Gemini API configuration
 * Returns: { status: "ok", model: "...", message: "..." } or error details
 */
export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if API key is configured
    if (!apiKey) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Gemini API key is not configured',
          code: 'MISSING_API_KEY',
          setup: {
            step1: 'Go to https://aistudio.google.com/app/apikey',
            step2: 'Create a new API key or copy existing one',
            step3: 'Add to .env.local: GEMINI_API_KEY=your_key_here',
            step4: 'Restart the dev server',
          },
        },
        { status: 503 }
      );
    }

    // Check if it's a placeholder
    if (
      apiKey.includes('paste_your') ||
      apiKey.includes('your_new') ||
      apiKey.includes('AIza') === false
    ) {
      return NextResponse.json(
        {
          status: 'error',
          error: 'Gemini API key appears to be invalid or placeholder',
          code: 'INVALID_API_KEY_FORMAT',
          hint: 'API key should start with "AIza"',
          fix: 'Get a valid key from https://aistudio.google.com/apikey',
        },
        { status: 400 }
      );
    }

    // Try to generate content to test the API
    console.log('Testing Gemini API with sample prompt...');
    const testPrompt = 'Write a brief hello world message.';

    try {
      const result = await generateBlogContent(testPrompt, 'professional');

      if (!result || result.length === 0) {
        return NextResponse.json(
          {
            status: 'error',
            error: 'Gemini API returned empty response',
            code: 'EMPTY_RESPONSE',
            hint: 'This might indicate API quota limits or account issues',
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          status: 'ok',
          message: 'Gemini API (OpenAI-Compatible) is working correctly',
          details: {
            apiKeyConfigured: true,
            baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
            model: 'gemini-2.0-flash',
            testContent: result.substring(0, 200) + '...',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    } catch (apiError: any) {
      const errorMessage = apiError.message || String(apiError);
      const status = apiError.status || 500;

      // Determine the type of error
      let errorCode = 'UNKNOWN_ERROR';
      let suggestion = '';

      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorCode = 'INVALID_API_KEY';
        suggestion = 'API key is invalid or revoked. Generate a new one at https://aistudio.google.com/apikey';
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorCode = 'PERMISSION_DENIED';
        suggestion = 'Account does not have permission. Check if Gemini API is enabled in Google Cloud Console';
      } else if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        errorCode = 'QUOTA_EXCEEDED';
        suggestion = 'API quota exceeded. Wait a few minutes or check billing in Google Cloud Console';
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        errorCode = 'MODEL_NOT_FOUND';
        suggestion =
          'Model not available for your account. Fallback models will be used: gemini-1.5-pro, gemini-pro';
      } else if (errorMessage.includes('500')) {
        errorCode = 'SERVER_ERROR';
        suggestion = 'Google Gemini API is having issues. Try again in a few moments';
      }

      return NextResponse.json(
        {
          status: 'error',
          error: errorMessage,
          code: errorCode,
          suggestion,
          debug: {
            fullError: errorMessage,
            timestamp: new Date().toISOString(),
          },
        },
        { status }
      );
    }
  } catch (error) {
    console.error('Test Gemini error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: String(error),
        code: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
