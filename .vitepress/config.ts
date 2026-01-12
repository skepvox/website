import fs from 'fs'
import path from 'path'
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
    text: 'Literatura',
    activeMatch: '^/literatura/',
    link: '/literatura/'
  },
  {
    text: 'Demos',
    activeMatch: '^/demos/',
    link: '/demos/'
  },
]

export const sidebar: ThemeConfig['sidebar'] = {
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

  '/enem-sandbox/': [
    {
      text: 'ENEM Sandbox 2025',
      items: [
        { text: 'Linguagens', link: '/enem-sandbox/2025/linguagens' },
        { text: 'Humanas', link: '/enem-sandbox/2025/humanas' },
        { text: 'Ciências da Natureza', link: '/enem-sandbox/2025/ciencias-da-natureza' },
        { text: 'Matemática', link: '/enem-sandbox/2025/matematica' }
      ]
    }
  ],
  '/enem/': [
    {
      text: 'ENEM 2025 · Caderno Verde',
      items: [
        { text: 'Ciências da Natureza', link: '/enem/2025/ciencias-da-natureza' },
        { text: 'Matemática', link: '/enem/2025/matematica' }
      ]
    }
  ],

  '/demos/': [
    {
      text: 'Demos',
      items: [
        { text: 'Visão geral', link: '/demos/' },
        { text: 'Metodologia', link: '/demos/metodologia' },
        { text: 'Pessoas', link: '/demos/pessoas/' },
        { text: 'Organizações', link: '/demos/organizacoes/' },
        { text: 'Casos', link: '/demos/casos/' },
        { text: 'Perguntas', link: '/demos/perguntas' },
        { text: 'Mapa Relacional', link: '/demos/mapa' },
        { text: 'Brasil', link: '/demos/brasil/' },
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

const SITE_ORIGIN = 'https://skepvox.com'

const PUBLIC_DIR = path.resolve(__dirname, '..', 'src', 'public')

const ndjsonPlugin: Plugin = {
  name: 'skepvox-ndjson-utf8',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const rawUrl = req.url
      if (!rawUrl) return next()

      const pathname = rawUrl.split('?')[0]
      if (!pathname?.endsWith('.jsonl')) return next()

      const relative = decodeURIComponent(pathname).replace(/^\//, '')
      const absolute = path.resolve(PUBLIC_DIR, relative)

      if (!absolute.startsWith(PUBLIC_DIR + path.sep)) return next()
      if (!fs.existsSync(absolute)) return next()

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')

      fs.createReadStream(absolute).pipe(res)
    })
  }
}

function stripSkepvoxSuffix(value: string) {
  return value.replace(/\s+—\s+Skepvox\s*$/i, '').trim()
}

function canonicalUrlFromRelativePath(relativePath: string) {
  const withoutExt = relativePath.replace(/\.md$/i, '')
  return `${SITE_ORIGIN}/${withoutExt}.html`
}

function demosNoteJsonUrl(demosId: string) {
  return `${SITE_ORIGIN}/demos-data/notes/${encodeURIComponent(demosId)}.json`
}

function urlForDemosHub(kind: string) {
  if (kind === 'person') return `${SITE_ORIGIN}/demos/pessoas/index.html`
  if (kind === 'org') return `${SITE_ORIGIN}/demos/organizacoes/index.html`
  if (kind === 'case') return `${SITE_ORIGIN}/demos/casos/index.html`
  return `${SITE_ORIGIN}/demos/index.html`
}

function labelForDemosHub(kind: string) {
  if (kind === 'person') return 'Pessoas'
  if (kind === 'org') return 'Organizações'
  if (kind === 'case') return 'Casos'
  return 'Demos'
}

const config: UserConfigExport<ThemeConfig> = (async () => {
  const mathjax = await initMathJax()
  const mathjaxMdPlugin = createMathJaxMdPlugin(mathjax)
  const mathjaxStyles = await getMathJaxStyles(mathjax)

  return defineConfigWithTheme<ThemeConfig>({
  extends: baseConfig,
  cleanUrls: false,

  transformHead: ({ pageData }: any) => {
    const frontmatter = pageData?.frontmatter ?? {}
    const demos = frontmatter?.demos
    const demosId = typeof demos?.id === 'string' ? demos.id : ''
    const demosType = typeof demos?.type === 'string' ? demos.type : ''

    if (!demosId) return []
    if (typeof pageData?.relativePath !== 'string') return []
    if (!pageData.relativePath.startsWith('demos/')) return []

    const title = typeof frontmatter.title === 'string' ? frontmatter.title : ''
    const description =
      typeof frontmatter.description === 'string'
        ? frontmatter.description
        : typeof pageData?.description === 'string'
          ? pageData.description
          : ''

    const canonicalUrl = canonicalUrlFromRelativePath(pageData.relativePath)
    const jsonUrl = demosNoteJsonUrl(demosId)
    const fallbackTitle = typeof pageData?.title === 'string' ? pageData.title : demosId
    const pageTitle = stripSkepvoxSuffix(title || fallbackTitle)
    const entityName = pageTitle
    const ogImage = `${SITE_ORIGIN}/og-skepvox.png`

    const sameAs: string[] = []
    const identifiers = demos?.identifiers
    if (identifiers && typeof identifiers === 'object') {
      for (const value of Object.values(identifiers as Record<string, unknown>)) {
        if (typeof value !== 'string') continue
        if (value.startsWith('http://') || value.startsWith('https://')) {
          sameAs.push(value)
        }
        if (/^Q[0-9]+$/.test(value)) {
          sameAs.push(`https://www.wikidata.org/wiki/${value}`)
        }
      }
    }

    const aliases = Array.isArray(demos?.aliases)
      ? (demos.aliases.filter((v: unknown) => typeof v === 'string') as string[])
      : []

    const entityType =
      demosType === 'person'
        ? 'Person'
        : demosType === 'org'
          ? 'Organization'
          : demosType === 'case'
            ? 'CreativeWork'
            : 'Thing'

    const pageType =
      demosType === 'person' || demosType === 'org' ? 'ProfilePage' : 'WebPage'

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Skepvox',
              item: `${SITE_ORIGIN}/`
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Demos',
              item: `${SITE_ORIGIN}/demos/index.html`
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: labelForDemosHub(demosType),
              item: urlForDemosHub(demosType)
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: entityName,
              item: canonicalUrl
            }
          ]
        },
        {
          '@type': pageType,
          '@id': `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: entityName,
          description,
          inLanguage: 'pt-BR',
          isAccessibleForFree: true,
          mainEntity: {
            '@id': `${canonicalUrl}#entity`
          }
        },
        {
          '@type': entityType,
          '@id': `${canonicalUrl}#entity`,
          name: entityName,
          identifier: demosId,
          ...(aliases.length ? { alternateName: aliases } : {}),
          ...(sameAs.length ? { sameAs } : {})
        }
      ]
    }

    return [
      ['link', { rel: 'canonical', href: canonicalUrl }],
      [
        'link',
        {
          rel: 'alternate',
          type: 'application/json',
          href: jsonUrl,
          title: 'Dados da nota (JSON)'
        }
      ],
      [
        'meta',
        {
          name: 'robots',
          content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        }
      ],
      ['meta', { property: 'og:title', content: pageTitle }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      ['meta', { property: 'og:type', content: 'article' }],
      ['meta', { property: 'og:site_name', content: 'Skepvox' }],
      ['meta', { property: 'og:locale', content: 'pt_BR' }],
      ['meta', { property: 'og:image', content: ogImage }],
      ['meta', { property: 'og:image:alt', content: 'Skepvox' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: pageTitle }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: ogImage }],
      ['meta', { name: 'twitter:image:alt', content: 'Skepvox' }],
      ['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)]
    ]
  },

  sitemap: {
    hostname: SITE_ORIGIN,
    transformItems: (items) => {
      const excluded = new Set([
        '/enem/2025/humanas',
        '/enem/2025/linguagens',
        '/enem/overrides/README'
      ])

      return items.filter((item) => {
        const normalized = item.url.startsWith('/') ? item.url : `/${item.url}`
        const comparable = normalized.replace(/\.html$/, '')
        return !excluded.has(comparable)
      })
    }
  },

  lang: 'pt-BR',
  title: 'Skepvox — Engenharia de Letras',
  description: 'Louis Lavelle, Literatura & Filosofia',
  srcDir: 'src',

  head: [
    ...(mathjaxStyles.css
      ? [['style', { id: mathjaxStyles.id }, mathjaxStyles.css] as HeadConfig]
      : []),
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    [
      'link',
      {
        rel: 'alternate',
        type: 'application/x-ndjson',
        href: '/demos-data/notes.jsonl',
        title: 'Skepvox · Demos · Notes (JSONL)'
      }
    ],
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['meta', { property: 'og:url', content: 'https://skepvox.com/' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Skepvox — Engenharia de Letras' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Louis Lavelle, Literatura & Filosofia'
      }
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: 'https://skepvox.com/og-skepvox-square.png'
      }
    ],
    [
      'meta',
      {
        name: 'twitter:image',
        content: 'https://skepvox.com/og-skepvox-square.png'
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
      include: ['gsap', 'dynamics.js'],
      exclude: ['@vue/repl']
    },
    // @ts-ignore
    ssr: {
      external: ['@vue/repl']
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
          'enem/**/*',
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
      ndjsonPlugin,
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
