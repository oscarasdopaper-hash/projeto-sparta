import React from 'react';
import { notFound } from 'next/navigation';
import { getCompanyByDomain, getLocalPageBySlug } from '@/lib/data';
import styles from './page.module.css';
import { ArrowRight, MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ domain: string, slug: string }> }) {
  const { domain, slug } = await params;
  const company = await getCompanyByDomain(domain);
  if (!company) return { title: 'Not Found' };

  const page = await getLocalPageBySlug(company.id, slug);
  if (!page) return { title: 'Not Found' };

  const title = page.meta_title || `${page.campaign?.service_name} em ${page.city} | ${company.name}`;
  const description = page.meta_description || page.content?.replace(/<[^>]*>?/gm, '').substring(0, 155);
  const imageUrl = page.campaign?.hero_image_url || company.default_blog_image_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : [],
      url: `https://${domain}/servicos/${slug}`,
      type: 'article',
    },
    alternates: {
      canonical: `https://${domain}/servicos/${slug}`,
    }
  };
}

export default async function LocalServicePage({
  params,
}: {
  params: Promise<{ domain: string, slug: string }>;
}) {
  const { domain, slug } = await params;
  const company = await getCompanyByDomain(domain);

  if (!company) {
    notFound();
  }

  const page = await getLocalPageBySlug(company.id, slug);

  if (!page) {
    notFound();
  }

  const imageUrl = page.campaign?.hero_image_url || company.default_blog_image_url;
  const isVideo = imageUrl?.match(/\.(mp4|webm|ogg)$/i);
  
  // Cria o link do WhatsApp para o CTA
  const whatsappNumber = company.whatsapp_number ? company.whatsapp_number.replace(/\D/g, '') : '';
  const waLink = whatsappNumber 
    ? `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(`Olá! Gostaria de um orçamento para ${page.campaign?.service_name} em ${page.city}. Vi a página no site.`)}` 
    : '#';

  // Injeção de Schema Markup LocalBusiness & Service
  const schemaOrgJSONLD = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Service'],
    name: company.name,
    image: company.logo_url || imageUrl,
    telephone: company.contact_phone || company.whatsapp_number,
    url: `https://${domain}`,
    areaServed: {
      '@type': 'City',
      name: page.city
    },
    serviceType: page.campaign?.service_name,
    description: page.meta_description || page.content?.replace(/<[^>]*>?/gm, '').substring(0, 155),
    provider: {
      '@type': 'LocalBusiness',
      name: company.name
    }
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJSONLD) }}
      />
      
      {/* Seção Hero Estilo Crypto Premium */}
      <section className={styles.premiumHero}>
        {/* Background Overlay */}
        <div className={styles.gridOverlay}></div>
        
        <div className={styles.heroSplitContent}>
          {/* Lado Esquerdo: Textos e CTA */}
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>ESPECIALISTAS DA REGIÃO</span>
            <h1 className={styles.cryptoTitle}>
              {page.campaign?.service_name} <br/>
              <span className={styles.neonHighlight}>em {page.city}</span>
            </h1>
            <p className={styles.cryptoSubtitle}>
              A principal plataforma de serviços para proteger e transformar seu ambiente com a qualidade da {company.name}.
            </p>
            
            <div className={styles.heroProof}>
              <div className={styles.avatars}>
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Cliente Satisfeito" className={styles.avatar} />
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Cliente Satisfeita" className={styles.avatar} />
                <img src="https://randomuser.me/api/portraits/men/68.jpg" alt="Cliente Satisfeito" className={styles.avatar} />
                <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="Cliente Satisfeita" className={styles.avatar} />
              </div>
              <div className={styles.proofText}>
                <strong>+{page.city.length * 153}</strong>
                <span>Clientes Satisfeitos na região</span>
              </div>
            </div>

            <a href={waLink} target="_blank" rel="noopener noreferrer" className={styles.cryptoCta}>
              Solicitar Orçamento 
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Lado Direito: Imagem Flutuante (Instalador/Produto) */}
          <div className={styles.heroGraphic}>
            {isVideo && imageUrl ? (
              <video 
                className={styles.floatingMedia} 
                autoPlay 
                loop 
                muted 
                playsInline
              >
                <source src={imageUrl} type={`video/${imageUrl?.split('.').pop()}`} />
              </video>
            ) : imageUrl ? (
              <img src={imageUrl} alt={page.campaign?.service_name} className={styles.floatingMedia} />
            ) : (
               <div className={styles.placeholderGraphic}>
                 {/* Um elemento visual genérico neon caso não tenha imagem */}
                 <div className={styles.neonCircle}></div>
                 <div className={styles.neonCircleSmall}></div>
               </div>
            )}
          </div>
        </div>
      </section>

      {/* Ticker / Marquee Dinâmico */}
      <div className={styles.marqueeContainer}>
        <div className={styles.marqueeContent}>
          {Array(8).fill(0).map((_, i) => (
            <span key={i} className={styles.marqueeItem}>
              {page.campaign?.service_name} em <strong>{page.city}</strong> <span className={styles.marqueeDot}>•</span> Qualidade Premium <span className={styles.marqueeDot}>•</span> Orçamento Rápido <span className={styles.marqueeDot}>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Conteúdo Gerado pela IA */}
      <div className={styles.contentWrapper}>
        <div 
          className={styles.postContent}
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
        
        {/* CTA Inferior */}
        <div className={styles.bottomCta}>
          <h3>Pronto para transformar seu ambiente em {page.city}?</h3>
          <p>Fale agora com nossos especialistas e agende uma avaliação gratuita.</p>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className={styles.ctaButton} style={{ marginTop: '16px', zIndex: 10 }}>
            Falar com Especialista <ArrowRight size={20} />
          </a>
        </div>
      </div>
    </div>
  );
}
