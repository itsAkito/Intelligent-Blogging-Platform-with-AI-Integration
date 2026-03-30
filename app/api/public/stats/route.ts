import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M+`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K+`;
  return String(value);
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Active creators: unique authors with at least one published post.
    const { data: postAuthors, error: postAuthorsError } = await supabase
      .from('posts')
      .select('author_id, ai_generated, views')
      .eq('status', 'published');

    if (postAuthorsError) {
      return NextResponse.json({ error: postAuthorsError.message }, { status: 400 });
    }

    const uniqueAuthors = new Set((postAuthors || []).map((p) => p.author_id).filter(Boolean));
    const syntheticPosts = (postAuthors || []).filter((p) => p.ai_generated).length;
    const monthlyReads = (postAuthors || []).reduce((sum, p) => sum + (p.views || 0), 0);

    // Industry mentors: explicit mentor role, with fallback to admins if mentor role is not used.
    const { count: mentorCount, error: mentorError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'mentor');

    if (mentorError) {
      return NextResponse.json({ error: mentorError.message }, { status: 400 });
    }

    let finalMentorCount = mentorCount || 0;

    if (finalMentorCount === 0) {
      const { count: adminCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');
      finalMentorCount = adminCount || 0;
    }

    const payload = {
      raw: {
        activeCreators: uniqueAuthors.size,
        syntheticPosts,
        monthlyReads,
        industryMentors: finalMentorCount,
      },
      display: {
        activeCreators: compactNumber(uniqueAuthors.size),
        syntheticPosts: compactNumber(syntheticPosts),
        monthlyReads: compactNumber(monthlyReads),
        industryMentors: compactNumber(finalMentorCount),
      },
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Public stats error:', error);
    return NextResponse.json(
      {
        raw: {
          activeCreators: 0,
          syntheticPosts: 0,
          monthlyReads: 0,
          industryMentors: 0,
        },
        display: {
          activeCreators: '0',
          syntheticPosts: '0',
          monthlyReads: '0',
          industryMentors: '0',
        },
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
