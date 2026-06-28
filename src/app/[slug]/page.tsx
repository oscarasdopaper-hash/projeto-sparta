import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Image from 'next/image';
import { ChevronRight, Calendar, Tag, BookOpen, ArrowLeft } from 'lucide-react';
import { getCompanyByDomain, getTermBySlug, getTerms, getAutoLinks, applyAutoLinks, translations } from '@/lib/data';
import styles from './detail.module.css';

interface Props {
  params: Promise<{ domain: string; slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const headersList = await headers();
  const domain = headersList.get('host') || process.env.NEXT_PUBLIC_CLIENT_ID || 'maben.com.br';
  const company = await getCompanyByDomain(domain);
  if (!company) return {};

  const term = await getTermBySlug(company.id, slug);
  if (!term) return {};

  const imageUrl = term.image_url || company.default_term_image_url;

  return {
    title: term.meta_title || `${term.title} - O que é, Significado e Conceito | ${company.name}`,
    description: term.meta_description || term.short_description || `Entenda o significado de ${term.title} no glossário da ${company.name}.`,
    openGraph: {
      title: term.meta_title || `${term.title} | ${company.name}`,
      description: term.meta_description || term.short_description || `Entenda o significado de ${term.title} no glossário da ${company.name}.`,
      type: 'article',
      images: imageUrl ? [{ url: imageUrl }] : [],
      url: `https://${domain}/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: term.meta_title || `${term.title} | ${company.name}`,
      description: term.meta_description || term.short_description || `Entenda o significado de ${term.title} no glossário da ${company.name}.`,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `https://${domain}/${slug}`,
    }
  };
}

export default async function TermDetailPage({ params }: Props) {
  const { slug } = await params;
  const headersList = await headers();
  const domain = headersList.get('host') || process.env.NEXT_PUBLIC_CLIENT_ID || 'maben.com.br';
  const company = await getCompanyByDomain(domain);
  if (!company) return notFound();

  const term = await getTermBySlug(company.id, slug);
  if (!term) return notFound();

  const lang = company.language || 'pt-br';
  const t = translations[lang] || translations['pt-br'];

  // Busca termos relacionados e auto links em paralelo
  const [relatedTerms, autoLinks] = await Promise.all([
    getTerms({
      companyId: company.id,
      letter: term.letter,
      limit: 6
    }),
    getAutoLinks(company.id)
  ]);

  const filteredRelated = relatedTerms.filter(rt => rt.id !== term.id).slice(0, 5);

  // Aplica os links inteligentes automaticamente no conteúdo
  const contentWithLinks = applyAutoLinks(term.content || '<p>Definição não disponível.</p>', autoLinks);

  const schemaOrgJSONLD: any = [
    {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      name: term.title,
      description: term.short_description || '',
      inDefinedTermSet: `https://${domain}`
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `O que é ${term.title}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: term.short_description || ''
          }
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: t.home,
          item: `https://${domain}`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: term.title,
          item: `https://${domain}/${slug}`
        }
      ]
    }
  ];

  if (term.faqs && term.faqs.length > 0) {
    term.faqs.forEach((faq: {question: string; answer: string}) => {
      schemaOrgJSONLD[1].mainEntity.push({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      });
    });
  }

  return (
    <article className={styles.articlePage}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJSONLD) }}
      />
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs}>
        <Link href="/">Glossary</Link>
        <ChevronRight size={14} className={styles.arrow} />
        {term.category && (
          <>
            <span className={styles.breadcrumbCategory}>{term.category.name}</span>
            <ChevronRight size={14} className={styles.arrow} />
          </>
        )}
        <span className={styles.current}>{term.title}</span>
      </nav>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Core Article content */}
        <div className={styles.contentArea}>
          <header className={styles.articleHeader}>
            {term.category && (
              <span className={styles.categoryBadge}>
                <Tag size={12} />
                {term.category.name}
              </span>
            )}
            <h1 className={styles.title}>{term.meta_title || term.title}</h1>
            
            <div className={styles.metaInfo}>
              <div className={styles.metaItem}>
                <Calendar size={14} />
                <span>{t.updatedAt} {new Date(term.updated_at || term.created_at || new Date()).toLocaleDateString(lang === 'pt-br' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US')}</span>
              </div>
            </div>

            {term.short_description && (
              <p className={styles.leadText}>
                {term.short_description}
              </p>
            )}
          </header>

          {(term.image_url || company.default_term_image_url) && (
            <div className={styles.heroImageWrapper}>
              <Image 
                src={term.image_url || company.default_term_image_url || ''} 
                alt={term.image_alt || term.title} 
                title={term.image_title || term.title} 
                width={800}
                height={450}
                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                priority
                className={styles.heroImage}
              />
            </div>
          )}

          {/* Rich content (HTML) from AI with automatic links */}
          <div 
            className={styles.richContent}
            dangerouslySetInnerHTML={{ __html: contentWithLinks }}
          />

          {term.faqs && term.faqs.length > 0 && (
            <div className={styles.faqSection}>
              <h2 className={styles.faqTitle}>Perguntas Frequentes sobre {term.title}</h2>
              {term.faqs.map((faq: {question: string; answer: string}, index: number) => (
                <details key={index} className={styles.faqItem}>
                  <summary className={styles.faqQuestion}>{faq.question}</summary>
                  <div className={styles.faqAnswer}>{faq.answer}</div>
                </details>
              ))}
            </div>
          )}

          <div className={styles.backWrapper}>
            <Link href="/" className={styles.backButton}>
              <ArrowLeft size={16} />
              {t.backHome}
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <BookOpen size={16} />
              <h2>{t.otherTerms} "{term.letter}"</h2>
            </div>
            {filteredRelated.length > 0 ? (
              <div className={styles.relatedList}>
                {filteredRelated.map(rt => (
                  <Link key={rt.id} href={`/${rt.slug}`} className={styles.relatedLink}>
                    <span className={styles.relatedTitle}>{rt.title}</span>
                    <p className={styles.relatedDesc}>{rt.short_description}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.noRelated}>{t.noRelated}</p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
