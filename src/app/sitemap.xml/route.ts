import { NextResponse } from 'next/server';
import { getCompanyByDomain, getTerms, getBlogPosts, getCategories, getLocalPages } from '@/lib/data';

// Cache da rota por 1 hora
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const { domain } = await params;
    const company = await getCompanyByDomain(domain);

    if (!company) {
      return new NextResponse('Company Not Found', { status: 404 });
    }

    // Protocolo preferencial
    const baseUrl = `https://${domain}`;

    // Buscar dados para o Sitemap
    // Usamos limit: 50000 que é o máximo seguro para sitemaps
    const terms = await getTerms({ companyId: company.id, limit: 10000 });
    const blogPosts = await getBlogPosts(company.id, 10000);
    const categories = await getCategories(company.id);
    const localPages = await getLocalPages(company.id, 10000);

    // Letras do alfabeto (A-Z) para as páginas de navegação
    const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

    // Montando as URLs
    const sitemapUrls: { loc: string; lastmod: string; priority: number }[] = [];

    const now = new Date().toISOString();

    // Helper to safely parse dates and avoid 500 Internal Server Errors
    const safeDate = (dateStr?: string | null, fallback?: string | null): string => {
      try {
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) return d.toISOString();
        }
        if (fallback) {
          const d = new Date(fallback);
          if (!isNaN(d.getTime())) return d.toISOString();
        }
      } catch (e) {
        // ignore
      }
      return now;
    };

    // 1. Home
    sitemapUrls.push({
      loc: `${baseUrl}/`,
      lastmod: now,
      priority: 1.0
    });

    // 2. Blog Index
    sitemapUrls.push({
      loc: `${baseUrl}/blog`,
      lastmod: now,
      priority: 0.9
    });

    // 3. Letras (Navegação Alfabética)
    for (const letter of letters) {
      sitemapUrls.push({
        loc: `${baseUrl}/letra/${letter.toLowerCase()}`,
        lastmod: now,
        priority: 0.6
      });
    }

    // 4. Categorias
    for (const cat of categories) {
      sitemapUrls.push({
        loc: `${baseUrl}/categoria/${cat.slug}`,
        lastmod: safeDate(cat.created_at),
        priority: 0.7
      });
    }

    // 5. Termos do Glossário
    for (const term of terms) {
      sitemapUrls.push({
        loc: `${baseUrl}/${term.slug}`,
        lastmod: safeDate(term.updated_at, term.created_at),
        priority: 0.8
      });
    }

    // 6. Posts do Blog
    for (const post of blogPosts) {
      sitemapUrls.push({
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: safeDate(post.updated_at, post.created_at),
        priority: 0.8
      });
    }

    // 7. Páginas Locais de Serviços
    for (const page of localPages) {
      sitemapUrls.push({
        loc: `${baseUrl}/servicos/${page.slug}`,
        lastmod: safeDate(page.updated_at, page.created_at),
        priority: 0.9 // Alta prioridade para SEO Local
      });
    }

    // Gerar XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapUrls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>
  `).join('').trim()}
</urlset>`;

    // Retornar a resposta XML
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Internal Server Error generating sitemap', { status: 500 });
  }
}
