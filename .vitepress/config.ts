import {
  defineConfigWithTheme,
  type Plugin,
  type UserConfigExport
} from 'vitepress'
import type { Config as ThemeConfig } from '@vue/theme'
import llmstxt from 'vitepress-plugin-llms'
import baseConfig from '@vue/theme/config'
import { headerPlugin } from './headerMdPlugin'
import { PILLARS } from './theme/components/pillars'
import {
  groupIconMdPlugin,
  groupIconVitePlugin
} from 'vitepress-plugin-group-icons'

// Three-pillar global nav: Home + the visible pillars derived from the shared pillars.ts IA, so nav and
// homepage share one source of truth and cannot drift (slice H2). The visible podcast pillar is Vox
// Français (/podcast/francais/); Vox Español / Vox English stay public and reachable by URL / the
// /podcast/ hub / the podcast sidebar / the sitemap, just not promoted in the primary nav. Filosofia and
// Literatura are the locale-rooted /pt/<section>/ sections; the legacy /literatura/ surface was retired
// in B5 (no redirect), so each pillar's activeMatch is its own locale-rooted prefix.
const nav: ThemeConfig['nav'] = [
  {
    text: 'Home',
    link: '/'
  },
  ...PILLARS.map((pillar) => ({
    text: pillar.label,
    activeMatch: pillar.activeMatch,
    link: pillar.href
  }))
]

export const sidebar: ThemeConfig['sidebar'] = {
  // Note (slice A3): /pt/filosofia/ intentionally has NO rented config sidebar. The section's
  // discovery is the global nav "Filosofia" entry + the two SSR CardGrid hubs (section -> author ->
  // work hub -> segments), so the hierarchy is fully navigable without duplicating the migrated
  // book's pipeline route into a hard-coded sidebar. A scoped key can be added if the section grows.
  '/podcast/': [
    {
      text: 'Vox Français',
      link: '/podcast/francais/',
      items: [
        { text: '001 - Le badge', link: '/podcast/francais/001-le-badge' },
        { text: '002 - La valise verte', link: '/podcast/francais/002-la-valise-verte' },
        { text: '003 - Le covoiturage poli', link: '/podcast/francais/003-le-covoiturage-poli' },
        { text: '004 - Le studio calme', link: '/podcast/francais/004-le-studio-calme' }
      ]
    },
    {
      text: 'Vox Español',
      link: '/podcast/espanol/',
      items: [
        { text: '001 - La boda es a las seis', link: '/podcast/espanol/001-la-boda-es-a-las-seis' },
        { text: '002 - La sartén está ocupada', link: '/podcast/espanol/002-la-sarten-esta-ocupada' },
        { text: '003 - El tren está parado', link: '/podcast/espanol/003-el-tren-esta-parado' }
      ]
    },
    {
      text: 'Vox English',
      link: '/podcast/english/',
      items: [
        { text: '001 - The Two-Minute Phone Call', link: '/podcast/english/001-the-two-minute-phone-call' },
        { text: '002 - The Bowl of Something', link: '/podcast/english/002-the-bowl-of-something' }
      ]
    }
  ],

  // The legacy hand-authored /literatura/ surface was retired (B5): Brás Cubas is live under
  // /pt/literatura/ via the pipeline reader, and the other books return only when rebuilt through
  // book-pipeline. Filosofia and Literatura sections navigate via the global nav + SSR CardGrid hubs,
  // not a rented config sidebar.
}

const i18n: ThemeConfig['i18n'] = {
  menu: 'Navegar',          // label in the mobile nav
  toc: 'Índice',   // "On this page"
  returnToTop: 'Retornar ao início', // "Return to top"
  appearance: 'Tema',
  search: 'Buscar',
  previous: 'Anterior',
  next: 'Próximo',
  pageNotFound: 'Página não encontrada',
  ariaSkipToContent: 'Pular para o conteúdo',
  ariaDarkMode: 'Alternar modo escuro',
  ariaToC: 'Índice da página',
  ariaMainNav: 'Navegação principal',
  ariaMobileNav: 'Navegação móvel',
  ariaSidebarNav: 'Navegação lateral'
}

const SITE_ORIGIN = 'https://www.skepvox.com'

const CANONICAL_HOSTNAME = 'www.skepvox.com'

function normalizeSitePathname(pathname: string): string {
  if (pathname === '/index.html') return '/'
  if (pathname.endsWith('/index.html')) return pathname.slice(0, -'index.html'.length)
  if (pathname.endsWith('.html')) return pathname.slice(0, -'.html'.length)
  return pathname
}

// Routes of buffer pages (frontmatter `buffer: true`), collected during page
// rendering and excluded from the sitemap. Buffer pages stay reachable by
// direct URL but are unlisted, noindexed, and out of search.
const bufferRoutes = new Set<string>()

// Routes of pipeline reader segment leaves (frontmatter `generated: pipeline-segment-routes`),
// collected during page rendering and pruned from the sitemap by isChapterRoute (marker-aware,
// slice A3). The work hub carries `pipeline-work-hub`, not this marker, so it is NOT collected and
// stays in the sitemap. This replaces the temporary pt/filosofia depth rule and covers any future
// locale/section with no new path rule.
const pipelineSegmentRoutes = new Set<string>()

function routeFromRelativePath(relativePath: string): string {
  return normalizeSitePathname('/' + relativePath.replace(/\.md$/, '.html'))
}

// Reader segment leaf routes are kept indexable and locally searchable but dropped from the sitemap, so
// broad "skepvox" searches favour the hubs and work pages rather than hundreds of chapter pages. Work
// hubs themselves stay in the sitemap. Pruning is purely MARKER-aware (slice A3): isChapterRoute drops
// any route collected into pipelineSegmentRoutes from the `pipeline-segment-routes` frontmatter marker —
// the locale-rooted pt leaves (/pt/filosofia/... + /pt/literatura/...) — while the work hubs
// (`pipeline-work-hub`) stay. This needs no per-section path rule, so future locales/sections are covered
// automatically. (The legacy path-keyed /literatura/ + /louis-lavelle/ depth rules were removed with
// their corpora in B5 / A5.)
function isChapterRoute(url: string): boolean {
  return pipelineSegmentRoutes.has(url)
}

function normalizeSiteUrl(input: string): string {
  if (
    !input.startsWith('https://skepvox.com') &&
    !input.startsWith('http://skepvox.com') &&
    !input.startsWith('https://www.skepvox.com') &&
    !input.startsWith('http://www.skepvox.com')
  ) {
    return input
  }

  try {
    const url = new URL(input)
    url.protocol = 'https:'
    url.hostname = CANONICAL_HOSTNAME
    url.pathname = normalizeSitePathname(url.pathname)
    return url.toString()
  } catch {
    return input
  }
}

function normalizeJsonLdUrls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeJsonLdUrls)
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    const normalized: Record<string, unknown> = {}
    for (const [key, v] of entries) normalized[key] = normalizeJsonLdUrls(v)
    return normalized
  }
  if (typeof value === 'string') return normalizeSiteUrl(value)
  return value
}

function normalizeHeadUrls(head: unknown): unknown {
  if (!Array.isArray(head)) return head

  return head.map((entry) => {
    if (!Array.isArray(entry) || entry.length < 2) return entry
    const [tag, attrs, children] = entry
    if (!attrs || typeof attrs !== 'object') return entry

    const normalizedAttrs: Record<string, unknown> = { ...(attrs as Record<string, unknown>) }
    for (const key of ['href', 'content', 'src']) {
      if (typeof normalizedAttrs[key] === 'string') {
        normalizedAttrs[key] = normalizeSiteUrl(normalizedAttrs[key] as string)
      }
    }

    if (
      tag === 'script' &&
      normalizedAttrs.type === 'application/ld+json' &&
      typeof children === 'string'
    ) {
      try {
        const json = JSON.parse(children) as unknown
        const normalizedJson = normalizeJsonLdUrls(json)
        return ['script', normalizedAttrs, JSON.stringify(normalizedJson, null, 2)]
      } catch {
        return ['script', normalizedAttrs, children.replaceAll('https://skepvox.com', SITE_ORIGIN)]
      }
    }

    return entry.length === 2 ? [tag, normalizedAttrs] : [tag, normalizedAttrs, children]
  })
}

const config: UserConfigExport<ThemeConfig> = (() => {
  return defineConfigWithTheme<ThemeConfig>({
  extends: baseConfig,
  cleanUrls: true,

  sitemap: {
    hostname: SITE_ORIGIN,
    transformItems: (items) =>
      items
        .map((item) => {
          const normalized = item.url.startsWith('/') ? item.url : `/${item.url}`
          return {
            ...item,
            url: normalizeSitePathname(normalized)
          }
        })
        .filter(
          (item) =>
            !bufferRoutes.has(item.url) && item.url !== '/404' && !isChapterRoute(item.url)
        )
  },

  lang: 'pt-BR',
  title: 'skepvox — Leituras e Estudos Pessoais',
  description: 'Leituras e estudos pessoais, reunidos em três seções.',
  srcDir: 'src',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#fcfcfa' }],
    ['meta', { property: 'og:url', content: `${SITE_ORIGIN}/` }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'skepvox — Leituras e Estudos Pessoais' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Leituras e estudos pessoais, reunidos em três seções.'
      }
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: `${SITE_ORIGIN}/og-skepvox.png`
      }
    ],
    [
      'meta',
      {
        name: 'twitter:image',
        content: `${SITE_ORIGIN}/og-skepvox.png`
      }
    ],
    ['meta', { name: 'twitter:site', content: '@skepvox' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    [
      'script',
      {
        async: '',
        src: 'https://www.googletagmanager.com/gtag/js?id=G-1VWHF2D1QJ'
      }
    ],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
try {
  if (localStorage.getItem('skepvox-consent') === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
} catch (e) {}
gtag('js', new Date());
gtag('config', 'G-1VWHF2D1QJ');`
    ],
    [
      'style',
      {},
      `#skepvox-consent{position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--vt-c-bg-soft,#f6f6f7);border-top:1px solid var(--vt-c-divider,#e2e2e3);color:var(--vt-c-text-1,#213547);font-size:14px;line-height:1.45}
#skepvox-consent .sc-actions{display:flex;gap:8px;flex-shrink:0}
#skepvox-consent button{padding:6px 14px;border-radius:6px;border:1px solid var(--vt-c-divider,#ccc);background:transparent;color:inherit;cursor:pointer;font-size:13px}
#skepvox-consent button:hover{border-color:var(--vt-c-brand,#3c8772)}
@media (max-width:640px){#skepvox-consent{justify-content:center;text-align:center}#skepvox-consent .sc-msg{flex-basis:100%}#skepvox-consent .sc-actions{flex-basis:100%;justify-content:center}}`
    ],
    [
      'script',
      {},
      `(function(){
  if (typeof document === 'undefined') return;
  function init(){
    try { if (localStorage.getItem('skepvox-consent')) return; } catch (e) { return; }
    var bar = document.createElement('div');
    bar.id = 'skepvox-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Aviso de privacidade');
    bar.innerHTML = '<div class="sc-msg">Usamos cookies de análise (Google Analytics) para entender o uso do site.</div><div class="sc-actions"><button type="button" class="sc-reject">Recusar</button><button type="button" class="sc-accept">Aceitar</button></div>';
    document.body.appendChild(bar);
    function choose(v){
      try { localStorage.setItem('skepvox-consent', v); } catch (e) {}
      if (v === 'granted' && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', { analytics_storage: 'granted' });
      }
      if (bar.parentNode) bar.parentNode.removeChild(bar);
    }
    bar.querySelector('.sc-accept').addEventListener('click', function(){ choose('granted'); });
    bar.querySelector('.sc-reject').addEventListener('click', function(){ choose('denied'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();`
    ],
    // Removed Vue docs preconnect; not used on this site.
    // This script is injecting the external banner at the top of the page
    // [
    //   'script',
    //   {
    //     src: 'https://media.bitterbrains.com/main.js?from=vuejs&type=top',
    //     async: 'true'
    //   }
    // ]
  ],

  themeConfig: {
    nav,
    sidebar,
    i18n,

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Buscar',
            buttonAriaLabel: 'Buscar'
          },
          modal: {
            noResultsText: 'Nenhum resultado para',
            resetButtonTitle: 'Limpar busca',
            backButtonTitle: 'Fechar busca',
            displayDetails: 'Exibir detalhes',
            footer: {
              selectText: 'Selecionar',
              navigateText: 'Navegar',
              closeText: 'Fechar'
            }
          }
        }
      }
    },

    // Instagram is the intended public presence, but @vue/theme@2.3.0 socialLinks accept
    // only a fixed preset icon set (no Instagram, no custom SVG) and derive the link's
    // accessible name from the icon string — so a `facebook` icon on an instagram.com URL
    // is both a wrong glyph and a wrong screen-reader name. A wrong icon + wrong name is
    // worse than no link, so Instagram is removed here until an owned social component can
    // render a proper Instagram icon + label. (`twitter` renders the X glyph via
    // @vue/theme's own mapping, matching the x.com link.)
    socialLinks: [
      { icon: 'github', link: 'https://github.com/skepvox/' },
      { icon: 'twitter', link: 'https://x.com/skepvox' }
    ],

    footer: {
      // license: {
      //   text: 'MIT License',
      //   link: 'https://opensource.org/licenses/MIT'
      // },
      copyright: `2025-${new Date().getFullYear()} © Thiago Oliveira`
    }
  },

  transformPageData: (pageData) => {
    const frontmatter = pageData.frontmatter
    if (!frontmatter || typeof frontmatter !== 'object') return
    // @ts-ignore - frontmatter is untyped; buffer pages are excluded from the sitemap
    if (frontmatter.buffer === true && pageData.relativePath) {
      bufferRoutes.add(routeFromRelativePath(pageData.relativePath))
    }
    // @ts-ignore - frontmatter is untyped; pipeline segment leaves are marker-pruned from the sitemap
    if (frontmatter.generated === 'pipeline-segment-routes' && pageData.relativePath) {
      pipelineSegmentRoutes.add(routeFromRelativePath(pageData.relativePath))
    }
    // @ts-ignore - frontmatter is untyped and can contain HeadConfig[]
    const head = frontmatter.head
    if (!Array.isArray(head)) return

    return {
      frontmatter: {
        ...frontmatter,
        head: normalizeHeadUrls(head)
      }
    }
  },

  transformHtml(code, _id, ctx) {
    const fm = (ctx.pageData?.frontmatter ?? {}) as Record<string, unknown>
    const rel = ctx.pageData?.relativePath ?? ''
    let lang: string | undefined
    if (typeof fm.language === 'string' && fm.language.trim()) {
      lang = fm.language.trim()
    } else if (rel.startsWith('podcast/francais')) {
      lang = 'fr'
    } else if (rel.startsWith('podcast/espanol')) {
      lang = 'es'
    } else if (rel.startsWith('podcast/english')) {
      lang = 'en'
    }
    if (!lang || lang === 'pt-BR') return
    let out = code.replace('<html lang="pt-BR"', `<html lang="${lang}"`)
    const ogLocale = ({ fr: 'fr_FR', es: 'es_ES', en: 'en_US' } as Record<string, string>)[
      lang.slice(0, 2)
    ]
    if (ogLocale && !out.includes('property="og:locale"')) {
      out = out.replace(
        '</head>',
        `<meta property="og:locale" content="${ogLocale}">\n</head>`
      )
    }
    return out
  },

  markdown: {
    theme: 'github-dark',
    config(md) {
      md.use(headerPlugin).use(groupIconMdPlugin)
    }
  },

  vite: {
    resolve: {
      dedupe: ['vue']
    },
    define: {
      __VUE_OPTIONS_API__: false
    },
    optimizeDeps: {
      include: []
    },
    server: {
      host: true,
      fs: {
        // for when developing with locally linked theme
        allow: ['../..']
      }
    },
    build: {
      chunkSizeWarningLimit: Infinity
    },
    json: {
      stringify: true
    },
    plugins: [
      llmstxt({
        // 'reading-review/**' is the internal pipeline-export review buffer surface (Slice 2C):
        // noindex/unlisted/out-of-search, and excluded from the LLM output too.
        // (The old fr edition of Introdução à ontologia and the whole legacy louis-lavelle corpus were
        // removed in slice A5, so they no longer need an ignore entry — the canonical pt edition under
        // /pt/filosofia/louis-lavelle/introducao-a-ontologia/ is the only Lavelle surface in the output.)
        // The pipeline-built Brás Cubas surface (/pt/literatura/**) was PUBLISHED in B3 (prefix-only
        // stable), so — like the public Lavelle pt edition — it now enters the LLM output and no longer
        // carries an ignore entry. ('index.md' still drops every hub from the LLM listing.)
        ignoreFiles: ['index.md', 'reading-review/**'],
        customLLMsTxtTemplate: `\
# skepvox

skepvox - Leituras e Estudos Pessoais

## Índice de Conteúdos

{toc}`
      }) as Plugin,
      groupIconVitePlugin({
        customIcon: {
          cypress: 'vscode-icons:file-type-cypress',
          'testing library': 'logos:testing-library'
        }
      }) as Plugin
    ]
  }
  })
})()

export default config
