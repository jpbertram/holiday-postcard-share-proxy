import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BOT_USER_AGENTS = [
  'linkedinbot',
  'facebookexternalhit',
  'twitterbot',
  'slackbot',
  'discordbot',
  'telegrambot',
  'whatsapp',
  'googlebot',
  'bingbot',
];

function isBot(userAgent: string): boolean {
  const ua = (userAgent || '').toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  try {
    // 1) Handle /share/:id
    const shareMatch = pathname.match(/^\/share\/([a-f0-9-]+)$/i);

    if (shareMatch) {
      const id = shareMatch[1];
      const userIsBot = isBot(userAgent);

      if (userIsBot) {
        // Serve OG HTML from Supabase edge function
        const supabaseBase = 'https://trpwhobyveotqulrkgls.supabase.co';
        const url = new URL('/functions/v1/share-meta', supabaseBase);
        url.searchParams.set('id', id);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'User-Agent': userAgent,
          },
        });

        if (!response.ok) {
          // Log for Vercel
          console.error(
            'Supabase share-meta returned non-OK status',
            response.status,
            await response.text().catch(() => '')
          );

          return new Response('Failed to load share metadata', {
            status: 502,
            headers: {
              'Content-Type': 'text/plain',
            },
          });
        }

        const html = await response.text();

        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      // Human users: redirect to app's /p/:id
      const redirectUrl = new URL(`/p/${id}`, 'https://holidaypostcards.changeengine.ai');
      return NextResponse.redirect(redirectUrl, 307);
    }

    // 2) All other paths → redirect to the main app domain
    const redirectUrl = new URL(pathname || '/', 'https://holidaypostcards.changeengine.ai');
    return NextResponse.redirect(redirectUrl, 307);
  } catch (error) {
    console.error('Middleware error:', error);

    return new Response('Internal Server Error (middleware)', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

// Only run middleware on relevant paths
export const config = {
  matcher: ['/share/:path*', '/p/:path*', '/'],
};
