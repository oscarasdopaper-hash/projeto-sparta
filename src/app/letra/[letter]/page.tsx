import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { getCompanyByDomain, getTerms, translations } from '@/lib/data';
import styles from './letter.module.css';

interface Props {
  params: Promise<{ domain: string; letter: string }>;
  searchParams: Promise<{ page?: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, letter } = await params;
  const company = await getCompanyByDomain(domain);
  if (!company) return {};

  const cleanLetter = letter.toUpperCase();

  return {
    title: `Termos Iniciados com a Letra ${cleanLetter} | ${company.name}`,
    description: `Navegue pelos termos técnicos, definições e conceitos que começam com a letra ${cleanLetter} no glossário de ${company.name}.`,
  };
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ITEMS_PER_PAGE = 12;

export default async function LetterPage({ params, searchParams }: Props) {
  const { domain, letter } = await params;
  const company = await getCompanyByDomain(domain);
  if (!company) return notFound();

  const cleanLetter = letter.toUpperCase();
  if (cleanLetter.length !== 1 || !/[A-Z]/.test(cleanLetter)) {
    return notFound();
  }

  const sParams = await searchParams;
  const currentPage = parseInt(sParams.page || '1') || 1;

  const lang = company.language || 'pt-br';
  const t = translations[lang] || translations['pt-br'];

  // Busca todos os termos desta letra e faz a paginação via javascript (slice)
  // Em um sistema maior, getTerms já receberia limit e offset.
  const allTerms = await getTerms({ companyId: company.id, letter: cleanLetter });
  
  // Ordena por data de criação (os mais recentes primeiro)
  allTerms.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalItems = allTerms.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTerms = allTerms.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className={styles.pageContainer}>
      
      {/* Régua de Navegação A-Z */}
      <nav className={styles.alphabetNav}>
        {ALPHABET.map(char => (
          <Link 
            key={char} 
            href={`/letra/${char.toLowerCase()}`}
            className={`${styles.alphabetLink} ${char === cleanLetter ? styles.active : ''}`}
          >
            {char}
          </Link>
        ))}
      </nav>

      <div className={styles.headerArea}>
        <span className={styles.watermark}>{cleanLetter}</span>
        <h1 className={styles.title}>
          Termos com a letra <span style={{ color: 'var(--tenant-primary)' }}>{cleanLetter}</span>
        </h1>

        {/* Busca Global redirecionando para a Home (/) ou página dedicada de busca */}
        {/* Como o input do usuário na home não puxa param, mandamos só pro "/" por enquanto, 
            e no futuro podemos interceptar. Aqui a intenção é ter a UI desenhada. */}
        <form action="/" method="GET" className={styles.searchForm}>
          <input 
            type="text" 
            name="q" 
            placeholder="Buscar em todo glossário..." 
            className={styles.searchInput} 
            autoComplete="off"
          />
          <button type="submit" className={styles.searchBtn}>
            <Search size={18} />
          </button>
        </form>
      </div>

      {paginatedTerms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <h2>Nenhum termo encontrado para a letra {cleanLetter}.</h2>
        </div>
      ) : (
        <>
          {/* Grid de 3 colunas x 4 linhas (12 itens) */}
          <div className={styles.grid}>
            {paginatedTerms.map(term => (
              <Link key={term.id} href={`/${term.slug}`} className={styles.card}>
                <h3 className={styles.cardTitle}>{term.title}</h3>
                <p className={styles.cardDesc}>{term.short_description || "Clique para conferir a definição detalhada deste termo."}</p>
                <span className={styles.readMore}>
                  Ler Definição <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {currentPage > 1 && (
                <Link href={`/letra/${letter.toLowerCase()}?page=${currentPage - 1}`} className={styles.pageBtn}>
                  Anterior
                </Link>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Link 
                  key={page} 
                  href={`/letra/${letter.toLowerCase()}?page=${page}`}
                  className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
                >
                  {page}
                </Link>
              ))}

              {currentPage < totalPages && (
                <Link href={`/letra/${letter.toLowerCase()}?page=${currentPage + 1}`} className={styles.pageBtn}>
                  Próximo
                </Link>
              )}
            </div>
          )}
        </>
      )}

      <div className={styles.backContainer}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={18} />
          Voltar para o Glossário
        </Link>
      </div>
    </div>
  );
}
