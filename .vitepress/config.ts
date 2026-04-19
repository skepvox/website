import {
  defineConfigWithTheme,
  type HeadConfig,
  type Plugin,
  type UserConfigExport
} from 'vitepress'
import type { Config as ThemeConfig } from '@vue/theme'
import llmstxt from 'vitepress-plugin-llms'
import baseConfig from '@vue/theme/config'
import { headerPlugin } from './headerMdPlugin'
// import { textAdPlugin } from './textAdMdPlugin'
import {
  groupIconMdPlugin,
  groupIconVitePlugin
} from 'vitepress-plugin-group-icons'
import {
  createMathJaxMdPlugin,
  getMathJaxStyles,
  initMathJax
} from './mathjaxMdPlugin'

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
    text: 'Podcasts',
    activeMatch: '^/podcast/',
    link: '/podcast/'
  },
  {
    text: 'Literatura',
    activeMatch: '^/literatura/',
    link: '/literatura/'
  },
]

export const sidebar: ThemeConfig['sidebar'] = {
  '/podcast/francais/': [
    {
      text: 'Vox Français - Podcast de français langue étrangère',
      items: [
        { text: 'Présentation', link: '/podcast/francais/' },
        { text: '001 - Le badge', link: '/podcast/francais/001-le-badge' },
        { text: '002 - La valise verte', link: '/podcast/francais/002-la-valise-verte' },
        { text: '003 - Le covoiturage poli', link: '/podcast/francais/003-le-covoiturage-poli' }
      ]
    },
    {
      text: 'Autres podcasts',
      items: [
        { text: 'English', link: '/podcast/english/' },
        { text: 'Español', link: '/podcast/espanol/' }
      ]
    }
  ],

  '/podcast/english/': [
    {
      text: 'Vox English - English as a Foreign Language Podcast',
      items: [
        { text: 'Overview', link: '/podcast/english/' }
      ]
    },
    {
      text: 'Other podcasts',
      items: [
        { text: 'Français', link: '/podcast/francais/' },
        { text: 'Español', link: '/podcast/espanol/' }
      ]
    }
  ],

  '/podcast/espanol/': [
    {
      text: 'Vox Español - Podcast de español como lengua extranjera',
      items: [
        { text: 'Presentación', link: '/podcast/espanol/' }
      ]
    },
    {
      text: 'Otros podcasts',
      items: [
        { text: 'Français', link: '/podcast/francais/' },
        { text: 'English', link: '/podcast/english/' }
      ]
    }
  ],

  '/podcast/': [
    {
      text: 'Podcasts',
      items: [
        { text: 'Visão geral', link: '/podcast/' },
        { text: 'Français', link: '/podcast/francais/' },
        { text: 'English', link: '/podcast/english/' },
        { text: 'Español', link: '/podcast/espanol/' }
      ]
    }
  ],

  '/literatura/': [
    {
      text: 'Machado de Assis', 
      items: [
        // { text: 'Visão geral', link: '/literatura/machado-de-assis/' },
        { text: 'Memórias Póstumas de Brás Cubas', link: '/literatura/machado-de-assis/bras-cubas' },
        { text: 'Quincas Borba', link: '/literatura/machado-de-assis/quincas-borba' },
        { text: 'Dom Casmurro', link: '/literatura/machado-de-assis/dom-casmurro' },
        { text: 'Esaú e Jacó', link: '/literatura/machado-de-assis/esau-e-jaco' },
        { text: 'O Alienista', link: '/literatura/machado-de-assis/o-alienista' },
        { text: 'A Cartomante', link: '/literatura/machado-de-assis/a-cartomante' },
        // depois: livros específicos
      ]
    },
    {
      text: 'Graciliano Ramos',
      items: [
        // { text: 'Visão geral', link: '/literatura/graciliano-ramos/' },
        { text: 'São Bernardo', link: '/literatura/graciliano-ramos/sao-bernardo' },
        { text: 'Angústia', link: '/literatura/graciliano-ramos/angustia' },
        { text: 'Vidas Secas', link: '/literatura/graciliano-ramos/vidas-secas' },
      ]
    },
    {
      text: 'Raul Pompeia', 
      items: [
        // { text: 'Visão geral', link: '/literatura/machado-de-assis/' },
        { text: 'O Ateneu', link: '/literatura/raul-pompeia/o-ateneu' },
        // depois: livros específicos
      ]
    },
  ],

  '/louis-lavelle/': [
    {
      text: 'Louis Lavelle',
      items: [
        { text: 'Biografia', link: '/louis-lavelle/' }
      ]
    },
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
  appearance: 'Modo de leitura'
}

const SITE_ORIGIN = 'https://www.skepvox.com'

const CANONICAL_HOSTNAME = 'www.skepvox.com'

function normalizeSkepvoxPathname(pathname: string): string {
  if (pathname === '/index.html') return '/'
  if (pathname.endsWith('/index.html')) return pathname.slice(0, -'index.html'.length)
  if (pathname.endsWith('.html')) return pathname.slice(0, -'.html'.length)
  return pathname
}

function normalizeSkepvoxUrl(input: string): string {
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
    url.pathname = normalizeSkepvoxPathname(url.pathname)
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
  if (typeof value === 'string') return normalizeSkepvoxUrl(value)
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
        normalizedAttrs[key] = normalizeSkepvoxUrl(normalizedAttrs[key] as string)
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

const config: UserConfigExport<ThemeConfig> = (async () => {
  const mathjax = await initMathJax()
  const mathjaxMdPlugin = createMathJaxMdPlugin(mathjax)
  const mathjaxStyles = await getMathJaxStyles(mathjax)

  return defineConfigWithTheme<ThemeConfig>({
  extends: baseConfig,
  cleanUrls: false,

  sitemap: {
    hostname: SITE_ORIGIN,
    transformItems: (items) =>
      items.map((item) => {
        const normalized = item.url.startsWith('/') ? item.url : `/${item.url}`
        return {
          ...item,
          url: normalizeSkepvoxPathname(normalized)
        }
      })
  },

  lang: 'pt-BR',
  title: 'Skepvox — Engenharia de Letras',
  description: 'Louis Lavelle e literatura clássica',
  srcDir: 'src',

  head: [
    ...(mathjaxStyles.css
      ? [['style', { id: mathjaxStyles.id }, mathjaxStyles.css] as HeadConfig]
      : []),
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['meta', { property: 'og:url', content: `${SITE_ORIGIN}/` }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Skepvox — Engenharia de Letras' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Louis Lavelle e literatura clássica'
      }
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: `${SITE_ORIGIN}/og-skepvox-square.png`
      }
    ],
    [
      'meta',
      {
        name: 'twitter:image',
        content: `${SITE_ORIGIN}/og-skepvox-square.png`
      }
    ],
    ['meta', { name: 'twitter:site', content: '@skepvox' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
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
      "window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-1VWHF2D1QJ');"
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

    // algolia: {
    //   indexName: 'vuejs',
    //   appId: 'ML0LEBN7FQ',
    //   apiKey: '21cf9df0734770a2448a9da64a700c22',
    //   searchParameters: {
    //     facetFilters: ['version:v3']
    //   }
    // },

    // carbonAds: {
    //   code: 'CEBDT27Y',
    //   placement: 'vuejsorg'
    // },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/skepvox/' },
      { icon: 'twitter', link: 'https://x.com/skepvox' },
      { icon: 'facebook', link: 'https://instagram.com/skepvox' }
    ],

    // editLink: {
    //   repo: 'vuejs/docs',
    //   text: 'Edit this page on GitHub'
    // },

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

  markdown: {
    theme: 'github-dark',
    config(md) {
      md.use(mathjaxMdPlugin)
      md.use(headerPlugin).use(groupIconMdPlugin)
      // .use(textAdPlugin)
    }
  },

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('mjx-')
      }
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
        ignoreFiles: [
          'about/team/**/*',
          'about/team.md',
          'about/privacy.md',
          'about/coc.md',
          'developers/**/*',
          'ecosystem/themes.md',
          'examples/**/*',
          'partners/**/*',
          'sponsor/**/*',
          'latim/**/*',
          'blog/**/*',
          'index.md'
        ],
        customLLMsTxtTemplate: `\
# Skepvox

Skepvox - Literatura & Filosofia

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
