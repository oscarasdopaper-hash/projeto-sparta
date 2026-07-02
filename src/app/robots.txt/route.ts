import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const host = request.headers.get('host') || 'localhost:3000';
  
  const robots = `User-agent: *
Allow: /
Disallow: /admin

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: GPTBot
Allow: /

Sitemap: https://${host}/sitemap.xml
`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
