import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCompanyByDomain, getRedirectCompany, translations } from '@/lib/data';
import styles from './layout.module.css';
import ClientHeader from './ClientHeader';
import ClientWhatsApp from './components/ClientWhatsApp';
import TopoFooter from './TopoFooter';
import { Outfit, Inter } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], display: 'swap', variable: '--font-outfit' });
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const domain = headersList.get('host') || process.env.NEXT_PUBLIC_CLIENT_ID || 'maben.com.br';
  const company = await getCompanyByDomain(domain);

  if (!company) return {};

  const siteName = company.name || 'Glossário';
  const defaultDesc = company.description || `Explore o glossário e artigos de ${siteName}.`;
  
  // Define fallback images for OG based on user comments (master images)
  const defaultOgImage = company.logo_url || `https://${domain}/default-og-image.jpg`;

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: defaultDesc,
    metadataBase: new URL(`https://${domain}`),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: siteName,
      description: defaultDesc,
      url: `https://${domain}`,
      siteName: siteName,
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
      locale: company.language || 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: defaultDesc,
      images: [defaultOgImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const domain = headersList.get('host') || process.env.NEXT_PUBLIC_CLIENT_ID || 'maben.com.br';
  const company = await getCompanyByDomain(domain);

  // Se a empresa não existir e não houver fallback, exibe erro simples
  if (!company) {
    return (
      <html lang="pt-BR" className={`${outfit.variable} ${inter.variable}`}>
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        <body>
          <div className={styles.noTenantContainer}>
            <div className={styles.noTenantCard}>
              <h1>Plataforma de Glossários SEO</h1>
              <p>Nenhuma empresa configurada para o domínio <strong>{domain}</strong>.</p>
              <p className={styles.subText}>Verifique se as chaves do Supabase estão corretas ou crie a empresa no painel administrativo.</p>
              <Link href="/admin" className={styles.adminLink}>
                Ir para o Painel Admin
              </Link>
            </div>
          </div>
        </body>
      </html>
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
      <html lang={company.language || 'pt-br'} className={`${outfit.variable} ${inter.variable}`}>
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        <body>
          <div className={styles.noTenantContainer}>
            <div className={styles.noTenantCard}>
              <h1 style={{ color: '#dc2626' }}>Serviço Temporariamente Suspenso</h1>
              <p>O glossário de <strong>{company.name}</strong> encontra-se temporariamente indisponível.</p>
              <p className={styles.subText}>Se você é o proprietário, entre em contato com a agência de suporte.</p>
            </div>
          </div>
        </body>
      </html>
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: company.name,
    url: `https://${domain}`,
    description: company.description || '',
    publisher: {
      '@type': 'Organization',
      name: company.name,
      logo: {
        '@type': 'ImageObject',
        url: company.logo_url || `https://${domain}/default-og-image.jpg`
      }
    }
  };

  return (
    <html lang={lang} className={`${outfit.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <div 
          className={styles.tenantLayout} 
          style={{ '--tenant-primary': primaryColor } as React.CSSProperties}
        >
          {/* Header */}
          <ClientHeader company={company} t={t} categories={categories || []} />

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
      </body>
    </html>
  );
}
