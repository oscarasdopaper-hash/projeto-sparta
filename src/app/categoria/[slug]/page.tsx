import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCompanyByDomain, getTerms } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import styles from './categoria.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const headersList = await headers();
  const domain = headersList.get('host') || process.env.NEXT_PUBLIC_CLIENT_ID || 'maben.com.br';
  const company = await getCompanyByDomain(domain);
  if (!company) return { title: 'Not Found' };

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('company_id', company.id)
    .eq('slug', slug)
    .single();

  if (!category) return { title: 'Not Found' };

  return {
    title: `${category.name} | Hub de Conhecimento | ${company.name}`,
    description: `Explore todos os termos técnicos e conceitos sobre ${category.name} em nosso glossário completo da ${company.name}.`,
    alternates: {
      canonical: `https://${domain}/categoria/${slug}`,
    }
  };
}

import { headers } from 'next/headers';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const ITEMS_PER_PAGE = 12;

export default async function CategoryHubPage({
  params,
  searchParams
}: Props) {
  const { slug } = await params;
  const headersList = await headers();
  const domain = headersList.get('host') || process.env.NEXT_PUBLIC_CLIENT_ID || 'maben.com.br';
  const company = await getCompanyByDomain(domain);

  if (!company) {
    notFound();
  }

  // 1. Busca a Categoria exata
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('company_id', company.id)
    .eq('slug', slug)
    .single();

  if (!category) {
    notFound();
  }

  // Pega página atual
  const sParams = await searchParams;
  const currentPage = parseInt(sParams.page || '1') || 1;

  // 2. Busca apenas os termos que pertencem a essa categoria
  const allTerms = await getTerms({ companyId: company.id, categorySlug: slug });
  
  // Ordena por data (os mais recentes primeiro)
  allTerms.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalItems = allTerms.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTerms = allTerms.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className={styles.container}>
      {/* O HUB HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Hub de Conhecimento</span>
          <h1 className={styles.title}>{category.name}</h1>
          <p className={styles.description}>
            Aprofunde-se nos conceitos de {category.name.toLowerCase()}. Abaixo você encontra todos os guias, termos e explicações reunidos em um só lugar.
          </p>
        </div>
      </section>

      {/* O GRID DE CARTÕES (WIKIPEDIA STYLE) */}
      {paginatedTerms.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>Nenhum conteúdo publicado</h3>
          <p>Ainda não publicamos termos para a categoria {category.name}. Volte em breve!</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {paginatedTerms.map((term) => (
              <Link key={term.id} href={`/${term.slug}`} className={styles.card}>
                <div className={`${styles.cardImageWrapper} ${!term.image_url ? styles.isPlaceholder : ''}`}>
                  {term.image_url ? (
                    <img 
                      src={term.image_url} 
                      alt={term.image_alt || term.title} 
                      className={styles.cardImage}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.placeholderImage}>
                      {term.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{term.title}</h3>
                  <p className={styles.cardExcerpt}>
                    {term.short_description || 
                     (term.content ? term.content.replace(/<[^>]*>?/gm, '').substring(0, 120) + '...' : 'Leia a definição completa.')}
                  </p>
                  <div className={styles.cardFooter}>
                    Ler Artigo
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {currentPage > 1 && (
                <Link href={`/categoria/${slug}?page=${currentPage - 1}`} className={styles.pageBtn}>
                  Anterior
                </Link>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Link 
                  key={page} 
                  href={`/categoria/${slug}?page=${page}`}
                  className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
                >
                  {page}
                </Link>
              ))}

              {currentPage < totalPages && (
                <Link href={`/categoria/${slug}?page=${currentPage + 1}`} className={styles.pageBtn}>
                  Próximo
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
