import type { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, cover_image_url, profiles(name)')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .single();

  if (!post) {
    return { title: 'Post Not Found | AiBlog' };
  }

  const title = `${post.title} | AiBlog`;
  const description = post.excerpt || `Read this article on AiBlog.`;
  const image = post.cover_image_url || '/og-image.png';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: { canonical: `https://aiblog.dev/blog/${slug}` },
  };
}

export default function BlogSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
