import type { MetadataRoute } from 'next';

// SEO (SPEC 5.9).
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/my'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
