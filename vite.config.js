import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { NAV_LINKS, PAGE_SEO, SITE_NAME, pageToPath, pageUrl } from './src/seo.js'

const escapeHtml = str => str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Writes dist/<page>/index.html with page-specific <head> tags (social link
// previews and non-JS crawlers never see the client-side updates) and a
// sitemap.xml generated from the same page list, so neither can drift.
function seoPages() {
  let outDir, root
  return {
    name: 'seo-pages',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = path.resolve(root, config.build.outDir)
    },
    closeBundle() {
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      const pages = NAV_LINKS.filter(page => PAGE_SEO[page])
      const links = pages.map(page => `<li><a href="${pageToPath(page)}">${escapeHtml(page)}</a></li>`).join('')

      for (const page of pages) {
        const { title, description } = PAGE_SEO[page]
        const url = pageUrl(page)
        // Opportunities pages sit under the Community board in the nav.
        const trail = page === 'Home' ? [] : ['Home', ...(pageToPath(page).startsWith('/opportunities/') ? ['Community'] : []), page]
        const breadcrumbs = trail.length ? `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: trail.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p, item: pageUrl(p) })),
        }).replace(/</g, '\\u003c')}</script>\n  ` : ''
        const t = escapeHtml(title)
        const d = escapeHtml(description)
        const html = template
          .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
          .replace(/(<meta name="description" content=")[^"]*/, `$1${d}`)
          .replace(/(<meta property="og:title" content=")[^"]*/, `$1${t}`)
          .replace(/(<meta property="og:description" content=")[^"]*/, `$1${d}`)
          .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}`)
          .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${t}`)
          .replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${d}`)
          .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}`)
          .replace('</head>', `${breadcrumbs}</head>`)
          .replace('<!--seo:noscript-->', `<noscript><h1>${t}</h1><p>${d}</p><nav aria-label="${escapeHtml(SITE_NAME)}"><ul>${links}</ul></nav></noscript>`)
        const file = page === 'Home' ? 'index.html' : path.join(pageToPath(page).slice(1), 'index.html')
        fs.mkdirSync(path.dirname(path.join(outDir, file)), { recursive: true })
        fs.writeFileSync(path.join(outDir, file), html)
      }

      // Vercel needs an explicit rewrite per page, or the SPA catch-all serves the home <head>.
      const rewrites = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).rewrites || []
      const missing = pages.filter(page => page !== 'Home' && !rewrites.some(r => r.source === pageToPath(page)))
      if (missing.length) this.warn(`vercel.json has no rewrite for: ${missing.map(pageToPath).join(', ')}`)

      const lastmod = new Date().toISOString().slice(0, 10)
      const urls = pages.map(page => {
        const { changefreq, priority } = PAGE_SEO[page]
        return `  <url>\n    <loc>${pageUrl(page)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
      })
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seoPages()],
})
