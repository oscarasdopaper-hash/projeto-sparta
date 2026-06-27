import React from 'react';
import { notFound } from 'next/navigation';
import { getCompanyByDomain, getBlogPostsPaginated } from '@/lib/data';
import Link from 'next/link';
import { Newspaper, ArrowRight, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './blog.module.css';

export const revalidate = 60; // ISR cache por 60 segundos

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const company = await getCompanyByDomain(domain);

  if (!company) return {};

  return {
    title: `Blog de Conteúdo | ${company.seo_title || company.name}`,
    description: `Acompanhe as últimas notícias, artigos e publicações do blog da ${company.name}.`,
    openGraph: {
      title: `Blog | ${company.name}`,
      description: `Acompanhe as últimas notícias, artigos e publicações do blog da ${company.name}.`,
      type: 'website',
      url: `https://${domain}/blog`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Blog | ${company.name}`,
      description: `Acompanhe as últimas notícias, artigos e publicações do blog da ${company.name}.`,
    },
    alternates: {
      canonical: `https://${domain}/blog`,
    }
  };
}

export default async function BlogIndexPage(props: {
  params: Promise<{ domain: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { domain } = await props.params;
  const searchParams = await props.searchParams;
  
  const company = await getCompanyByDomain(domain);

  if (!company) {
    notFound();
  }

  const currentPage = parseInt(searchParams?.page || '1', 10);
  
  let limit = 6;
  let offset = 0;
  
  if (currentPage === 1) {
    limit = 7; // 1 destaque + 6 na grade = 7
    offset = 0;
  } else {
    limit = 6; // 6 na grade
    offset = 7 + (currentPage - 2) * 6;
  }

  // Busca os posts paginados
  const { posts, totalCount } = await getBlogPostsPaginated(company.id, limit, offset);
  
  // Calcula o total de páginas (página 1 tem 7 posts, as demais tem 6)
  const totalPages = totalCount <= 7 ? 1 : 1 + Math.ceil((totalCount - 7) / 6);

  const schemaOrgJSONLD = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `Blog - ${company.name}`,
    url: `https://${domain}/blog`,
    description: `Últimos artigos, dicas e novidades da ${company.name}.`,
    publisher: {
      '@type': 'Organization',
      name: company.name,
      logo: company.logo_url || `https://${domain}/icon.png`
    },
    blogPost: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `https://${domain}/blog/${post.slug}`,
      datePublished: post.created_at,
      image: post.image_url || company.default_blog_image_url || `https://${domain}/icon.png`
    }))
  };

  // Se for página 1 e tiver posts, o primeiro é destaque.
  const featuredPost = currentPage === 1 && posts.length > 0 ? posts[0] : null;
  // Os demais (ou todos se não for página 1) vão pra grade.
  const gridPosts = currentPage === 1 ? posts.slice(1) : posts;

  return (
    <div className={styles.blogContainer}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJSONLD) }}
      />
      <h1 className={styles.pageTitle}>Blog</h1>
      <p className={styles.pageSubtitle}>Últimos artigos, dicas e novidades</p>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <Newspaper size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h2>Nenhum artigo publicado ainda.</h2>
          <p>O Autopilot logo escreverá novidades para você.</p>
        </div>
      ) : (
        <>
          {/* Featured Post (Apenas na Página 1) */}
          {featuredPost && (
            <Link href={`/blog/${featuredPost.slug}`} className={styles.featuredCard}>
              <div className={styles.featuredImageWrapper}>
                {featuredPost.image_url || company.default_blog_image_url ? (
                  <img 
                    src={featuredPost.image_url || company.default_blog_image_url || ''} 
                    alt={featuredPost.title} 
                    className={styles.image} 
                  />
                ) : (
                  <div className={styles.noImage}>
                    <ImageIcon size={48} />
                    <span>Sem Imagem</span>
                  </div>
                )}
              </div>
              <div className={styles.featuredContent}>
                <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                <div className={styles.date}>
                  {new Date(featuredPost.created_at).toLocaleDateString(
                    company.language === 'en' ? 'en-US' : company.language === 'es' ? 'es-ES' : 'pt-BR', 
                    { day: 'numeric', month: 'long', year: 'numeric' }
                  )}
                </div>
                <div className={styles.featuredExcerpt}>
                  {featuredPost.content ? featuredPost.content.replace(/<[^>]*>?/gm, '').substring(0, 250) + '...' : ''}
                </div>
                <div className={styles.readMore}>
                  Ler Artigo Destaque <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          )}

          {/* Grid de Posts */}
          {gridPosts.length > 0 && (
            <div className={styles.grid}>
              {gridPosts.map(post => {
                const imageUrl = post.image_url || company.default_blog_image_url || null;
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className={styles.card}>
                    <div className={styles.imageWrapper}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={post.title} className={styles.image} />
                      ) : (
                        <div className={styles.noImage}>
                          <ImageIcon size={32} />
                          <span>Sem Imagem</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.content}>
                      <h2 className={styles.title}>{post.title}</h2>
                      <div className={styles.date}>
                        {new Date(post.created_at).toLocaleDateString(
                          company.language === 'en' ? 'en-US' : company.language === 'es' ? 'es-ES' : 'pt-BR', 
                          { day: 'numeric', month: 'long', year: 'numeric' }
                        )}
                      </div>
                      <div className={styles.excerpt}>
                        {post.content ? post.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : ''}
                      </div>
                      <div className={styles.readMore}>
                        Ler Artigo <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {currentPage > 1 ? (
                <Link href={`/blog?page=${currentPage - 1}`} className={styles.pageButton}>
                  <ChevronLeft size={18} />
                </Link>
              ) : (
                <span className={`${styles.pageButton} ${styles.pageButtonDisabled}`}>
                  <ChevronLeft size={18} />
                </span>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Link 
                  key={page} 
                  href={`/blog?page=${page}`} 
                  className={`${styles.pageButton} ${page === currentPage ? styles.pageButtonActive : ''}`}
                >
                  {page}
                </Link>
              ))}

              {currentPage < totalPages ? (
                <Link href={`/blog?page=${currentPage + 1}`} className={styles.pageButton}>
                  <ChevronRight size={18} />
                </Link>
              ) : (
                <span className={`${styles.pageButton} ${styles.pageButtonDisabled}`}>
                  <ChevronRight size={18} />
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
