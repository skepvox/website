import {
  defineConfigWithTheme,
  type Plugin,
  type UserConfigExport
} from 'vitepress'
import type { Config as ThemeConfig } from '@vue/theme'
import llmstxt from 'vitepress-plugin-llms'
import baseConfig from '@vue/theme/config'
import { headerPlugin } from './headerMdPlugin'
import {
  groupIconMdPlugin,
  groupIconVitePlugin
} from 'vitepress-plugin-group-icons'

const nav: ThemeConfig['nav'] = [
  {
    text: 'Home',
    link: '/'
  },
  {
    text: 'Lavelle',
    activeMatch: '^/louis-lavelle/',
    link: '/louis-lavelle/'
  },
  {
    text: 'Literatura',
    activeMatch: '^/literatura/',
    link: '/literatura/'
  },
  {
    text: 'Podcasts',
    activeMatch: '^/podcast/',
    link: '/podcast/'
  },
]

export const sidebar: ThemeConfig['sidebar'] = {
  '/podcast/': [
    {
      text: 'Vox Français',
      link: '/podcast/francais/',
      items: [
        { text: '001 - Le badge', link: '/podcast/francais/001-le-badge' },
        { text: '002 - La valise verte', link: '/podcast/francais/002-la-valise-verte' },
        { text: '003 - Le covoiturage poli', link: '/podcast/francais/003-le-covoiturage-poli' }
      ]
    },
    {
      text: 'Vox Español',
      link: '/podcast/espanol/',
      items: [
        { text: '001 - La boda es a las seis', link: '/podcast/espanol/001-la-boda-es-a-las-seis' },
        { text: '002 - La sartén está ocupada', link: '/podcast/espanol/002-la-sarten-esta-ocupada' }
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

  '/literatura/': [
    {
      text: 'Machado de Assis',
      link: '/literatura/machado-de-assis/',
      items: [
        { text: 'Memórias Póstumas de Brás Cubas', link: '/literatura/machado-de-assis/bras-cubas' },
        { text: 'Quincas Borba', link: '/literatura/machado-de-assis/quincas-borba' },
        { text: 'Dom Casmurro', link: '/literatura/machado-de-assis/dom-casmurro' },
        { text: 'Esaú e Jacó', link: '/literatura/machado-de-assis/esau-e-jaco' },
        { text: 'O Alienista', link: '/literatura/machado-de-assis/o-alienista' },
        { text: 'A Cartomante', link: '/literatura/machado-de-assis/a-cartomante' }
      ]
    },
    {
      text: 'Graciliano Ramos',
      link: '/literatura/graciliano-ramos/',
      items: [
        { text: 'São Bernardo', link: '/literatura/graciliano-ramos/sao-bernardo' },
        { text: 'Angústia', link: '/literatura/graciliano-ramos/angustia' },
        { text: 'Vidas Secas', link: '/literatura/graciliano-ramos/vidas-secas' }
      ]
    },
    {
      text: 'Raul Pompeia',
      link: '/literatura/raul-pompeia/',
      items: [
        { text: 'O Ateneu', link: '/literatura/raul-pompeia/o-ateneu' }
      ]
    }
  ],

  '/louis-lavelle/': [
    {
      text: "La Dialectique de l'éternel présent",
      items: [
        { text: "De l'être", link: '/louis-lavelle/de-l-etre' },
        { text: "De l'acte", link: '/louis-lavelle/de-l-acte' },
        { text: "Du temps et de l'éternité", link: '/louis-lavelle/du-temps-et-de-l-eternite' },
        { text: "De l'âme humaine", link: '/louis-lavelle/de-l-ame-humaine' }
      ]
    },
    {
      text: 'Œuvres introductoires',
      items: [
        { text: 'A consciência de si', link: '/louis-lavelle/a-consciencia-de-si' },
        { text: 'La conscience de soi', link: '/louis-lavelle/la-conscience-de-soi' },
        { text: 'La Présence totale', link: '/louis-lavelle/la-presence-totale' },
        { text: "Introduction à l'ontologie", link: '/louis-lavelle/introduction-a-l-ontologie' }
      ]
    },
    {
      text: 'Œuvres morales',
      items: [
        { text: "L'Erreur de Narcisse", link: '/louis-lavelle/l-erreur-de-narcisse' },
        { text: 'Quatre saints', link: '/louis-lavelle/quatre-saints' }
      ]
    }
  ],
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

function routeFromRelativePath(relativePath: string): string {
  return normalizeSitePathname('/' + relativePath.replace(/\.md$/, '.html'))
}

// Book/chapter leaf routes are kept indexable and locally searchable but dropped
// from the sitemap, so broad "skepvox" searches favour the hubs and work pages
// rather than hundreds of chapter pages. Work pages themselves (one level up)
// stay in the sitemap. URLs here are already normalised (extensionless, hubs end
// in "/").
//   /literatura/<author>/<work>/<chapter>  -> dropped
//   /louis-lavelle/<work>/<chapter>        -> dropped
function isChapterRoute(url: string): boolean {
  const segments = url.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  if (segments[0] === 'literatura' && segments.length >= 4) return true
  if (segments[0] === 'louis-lavelle' && segments.length >= 3) return true
  return false
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
  title: 'skepvox — Engenharia de Letras',
  description: 'Louis Lavelle, literatura clássica e podcasts',
  srcDir: 'src',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#fcfcfa' }],
    ['meta', { property: 'og:url', content: `${SITE_ORIGIN}/` }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'skepvox — Engenharia de Letras' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Louis Lavelle, literatura clássica e podcasts'
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
        // The old fr edition of Introdução à ontologia is superseded by the canonical pt edition under
        // introducao-a-ontologia. Keep its prose out of the LLM output: the 12 chapter pages
        // ('…/introduction-a-l-ontologie/**', 301 redirect sources) AND the full-text fr hub
        // ('…/introduction-a-l-ontologie.md', which inlines the same chapters).
        ignoreFiles: [
          'index.md',
          'reading-review/**',
          'louis-lavelle/introduction-a-l-ontologie.md',
          'louis-lavelle/introduction-a-l-ontologie/**'
        ],
        customLLMsTxtTemplate: `\
# skepvox

skepvox - Literatura & Filosofia

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
