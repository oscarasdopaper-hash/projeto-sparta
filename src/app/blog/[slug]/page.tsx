import React from 'react';
import { notFound } from 'next/navigation';
import { getCompanyByDomain, getBlogPostBySlug, getAutoLinks, getBlogPosts } from '@/lib/data';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import styles from '../blog.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const headersList = await headers();
  const domain = headersList.get('host') || process.env.NEXT_PUBLIC_CLIENT_ID || 'maben.com.br';
  const company = await getCompanyByDomain(domain);
  if (!company) return { title: 'Not Found' };

  const post = await getBlogPostBySlug(company.id, slug);
  if (!post) return { title: 'Not Found' };

  return {
    title: post.meta_title || `${post.title} | ${company.seo_title || company.name}`,
    description: post.meta_description || post.content?.replace(/<[^>]*>?/gm, '').substring(0, 155),
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.content?.replace(/<[^>]*>?/gm, '').substring(0, 155),
      images: (post.image_url || company.default_blog_image_url) ? [{ url: post.image_url || company.default_blog_image_url as string }] : [],
      url: `https://${domain}/blog/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.content?.replace(/<[^>]*>?/gm, '').substring(0, 155),
      images: (post.image_url || company.default_blog_image_url) ? [post.image_url || company.default_blog_image_url as string] : [],
    },
    alternates: {
      canonical: `https://${domain}/blog/${slug}`,
    }
  };
}

import { headers } from 'next/headers';

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const headersList = await headers();
  const domain = headersList.get('host') || process.env.NEXT_PUBLIC_CLIENT_ID || 'maben.com.br';
  const company = await getCompanyByDomain(domain);

  if (!company) {
    notFound();
  }

  const post = await getBlogPostBySlug(company.id, slug);

  if (!post) {
    notFound();
  }

  const [autoLinks, recentPosts] = await Promise.all([
    getAutoLinks(company.id),
    getBlogPosts(company.id, 10)
  ]);

  const otherPosts = recentPosts.filter(p => p.id !== post.id);

  let processedContent = post.content || '';

  // 1. Injeção dinâmica de "Leia Também" (Substitui blocos fakes antigos e a nova tag)
  const injectionRegex = /<div class="editorial-related-box">.*?<\/div>|\[INJECT_RELATED_POST\]/gi;
  let injectionCount = 0;
  
  processedContent = processedContent.replace(injectionRegex, () => {
    if (otherPosts.length > 0) {
      // Pega um post diferente a cada injeção
      const injectedPost = otherPosts[injectionCount % otherPosts.length];
      injectionCount++;
      return `<div class="editorial-related-box"><strong>Leia também</strong><a href="/blog/${injectedPost.slug}">${injectedPost.title}</a></div>`;
    }
    // Se não houver posts suficientes, remove a tag/bloco sem deixar rastros
    return '';
  });
  autoLinks.forEach(link => {
    let limit = link.limit_per_page || 1;
    let count = 0;
    
    // RegEx que não substitui dentro de tags HTML (href, alt, etc)
    const regex = new RegExp(`(?<!<[^>]*?)\\b(${link.keyword})\\b(?![^<]*?>)`, 'gi');
    processedContent = processedContent.replace(regex, (match) => {
      if (count < limit) {
        count++;
        return `<a href="${link.target_url}" style="color: ${company.primary_color}; font-weight: 600; text-decoration: underline;" target="_blank" rel="noopener noreferrer">${match}</a>`;
      }
      return match;
    });
  });

  // Table of Contents generation
  const headings: { id: string; text: string; level: number }[] = [];
  processedContent = processedContent.replace(/<h([23])>(.*?)<\/h\1>/g, (match, level, text) => {
    // Limpa tags HTML internas se houver
    const cleanText = text.replace(/<[^>]*>?/gm, '');
    const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    headings.push({ id, text: cleanText, level: parseInt(level) });
    return `<h${level} id="${id}" style="scroll-margin-top: 100px;">${text}</h${level}>`;
  });

  const schemaOrgJSONLD = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: (post.image_url || company.default_blog_image_url) ? [post.image_url || company.default_blog_image_url as string] : [],
    datePublished: new Date(post.created_at).toISOString(),
    dateModified: new Date(post.created_at).toISOString(),
    author: {
      '@type': 'Organization',
      name: company.name,
      url: `https://${domain}`
    },
    publisher: {
      '@type': 'Organization',
      name: company.name,
      logo: company.logo_url ? {
        '@type': 'ImageObject',
        url: company.logo_url
      } : undefined
    },
    description: post.content?.replace(/<[^>]*>?/gm, '').substring(0, 155)
  };

  return (
    <div className={styles.postContainer}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJSONLD) }}
      />
      <Link href="/blog" className={styles.backLink}>
        <ArrowLeft size={16} /> Voltar para o Blog
      </Link>

      <header className={styles.postHeader}>
        <h1 className={styles.postTitle}>{post.title}</h1>
        <div className={styles.postMeta}>
          <Calendar size={16} />
          {new Date(post.created_at).toLocaleDateString(
            company.language === 'en' ? 'en-US' : company.language === 'es' ? 'es-ES' : 'pt-BR', 
            { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }
          )}
        </div>
      </header>

      {(post.image_url || company.default_blog_image_url) && (
        <div className={styles.postHeroImage}>
          <img src={post.image_url || company.default_blog_image_url as string} alt={post.image_alt || post.title} title={post.image_title || post.title} />
        </div>
      )}

      {headings.length > 0 && (
        <div className={styles.tocContainer}>
          <h3 className={styles.tocTitle}>Neste Artigo</h3>
          <ul className={styles.tocList}>
            {headings.map((h, i) => (
              <li key={i} style={{ marginBottom: '8px', paddingLeft: h.level === 3 ? '16px' : '0' }}>
                <a 
                  href={`#${h.id}`} 
                  className={styles.tocLink}
                  style={{ fontSize: h.level === 3 ? '0.95rem' : '1rem' }}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div 
        className={styles.postContent}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </div>
  );
}
