import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCompanyByDomain, getRedirectCompany, translations } from '@/lib/data';
import styles from './layout.module.css';
import HeroWrapper from './HeroWrapper';
import ClientHeader from './ClientHeader';
import ClientWhatsApp from './components/ClientWhatsApp';
import TopoFooter from './TopoFooter';

export async function generateMetadata(): Promise<Metadata> {
  const domain = process.env.NEXT_PUBLIC_CLIENT_ID || 'maben.com.br';
  const company = await getCompanyByDomain(domain);

  if (!company) return {};

  return {};
}

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const domain = process.env.NEXT_PUBLIC_CLIENT_ID || 'maben.com.br';
  const company = await getCompanyByDomain(domain);

  // Se a empresa não existir e não houver fallback, exibe erro simples
  if (!company) {
    return (
      <div className={styles.noTenantContainer}>
        <div className={styles.noTenantCard}>
          <h1>Plataforma de Glossários SEO</h1>
          <p>Nenhuma empresa configurada para o domínio <strong>{domain}</strong>.</p>
          <p className={styles.subText}>Crie e configure esta empresa no painel administrativo.</p>
          <Link href="/admin" className={styles.adminLink}>
            Ir para o Painel Admin
          </Link>
        </div>
      </div>
    );
  }

  // Tratativa de Inatividade / Cancelamento (Controle de Ativo)
  if (company.status === 'inactive') {
    // Tenta obter a empresa de destino para redirecionamento 301 (portabilidade de tráfego)
    const redirectTarget = await getRedirectCompany(company);
    if (redirectTarget) {
      const targetUrl = redirectTarget.domain 
        ? `http://${redirectTarget.domain}` 
        : `http://localhost:3000`; // Em prod, usaria o subdomínio correspondente
      redirect(targetUrl);
    }

    // Caso inativo e sem redirecionamento, mostra tela amigável de suspenso
    return (
      <div className={styles.noTenantContainer}>
        <div className={styles.noTenantCard}>
          <h1 style={{ color: '#dc2626' }}>Serviço Temporariamente Suspenso</h1>
          <p>O glossário de <strong>{company.name}</strong> encontra-se temporariamente indisponível.</p>
          <p className={styles.subText}>Se você é o proprietário, entre em contato com a agência de suporte.</p>
        </div>
      </div>
    );
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const primaryColor = company.primary_color || '#25aa00';
  
  // Idioma e Tradução
  const lang = company.language || 'pt-br';
  const t = translations[lang] || translations['pt-br'];

  // Fetch categories
  const { getServiceSupabase } = await import('@/lib/supabase');
  const adminSupabase = getServiceSupabase();
  const { data: categories } = await adminSupabase
    .from('categories')
    .select('id, name, slug')
    .eq('company_id', company.id)
    .order('name');

  return (
    <div 
      className={styles.tenantLayout} 
      style={{ '--tenant-primary': primaryColor } as React.CSSProperties}
    >
      {/* Header */}
      {/* Header */}
      <ClientHeader company={company} t={t} categories={categories || []} />

      {/* Hero / A-Z Navigation (Conditional via Wrapper) */}
      <HeroWrapper t={t} alphabet={alphabet} />

      {/* Main Content */}
      <main className={`${styles.mainContent} global-main-content`}>
        <div className={`${styles.mainContainer} global-main-container`}>
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className={`${styles.footer} global-footer`}>
        <div className={styles.footerContainer}>
          <p>&copy; {new Date().getFullYear()} {company.name}. Todos os direitos reservados.</p>
          <TopoFooter />
        </div>
      </footer>

      {company.whatsapp_number && (
        <ClientWhatsApp 
          whatsappNumber={company.whatsapp_number}
          phrases={company.whatsapp_phrases || []}
          avatarUrl={company.whatsapp_avatar_url || ''}
        />
      )}
    </div>
  );
}
