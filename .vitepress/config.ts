import fs from 'fs'
import path from 'path'
import {
  defineConfigWithTheme,
  type HeadConfig,
  type Plugin
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
import markdownItMathjax3 from 'markdown-it-mathjax3'

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
    items: [
      { text: 'Machado de Assis', link: '/literatura/machado-de-assis/bras-cubas' },
      { text: 'Graciliano Ramos', link: '/literatura/graciliano-ramos/sao-bernardo' },
      { text: 'Raul Pompeia', link: '/literatura/raul-pompeia/o-ateneu' },
    ]
  },
  {
    text: 'ENEM',
    link: '/enem/2025/matematica'
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
        { text: 'Biografia', link: '/louis-lavelle/' },
        { text: "De l'Être", link: '/louis-lavelle/de-l-etre' },
        { text: "L'Erreur de Narcisse", link: '/louis-lavelle/l-erreur-de-narcisse' },
        { text: "Quatre Saints", link: '/louis-lavelle/quatre-saints' }
      ]
    }
  ],

  '/enem-sandbox/': [
    {
      text: 'ENEM Sandbox 2025',
      items: [
        { text: 'Linguagens', link: '/enem-sandbox/2025/linguagens' },
        { text: 'Humanas', link: '/enem-sandbox/2025/humanas' },
        { text: 'Natureza', link: '/enem-sandbox/2025/natureza' },
        { text: 'Matemática', link: '/enem-sandbox/2025/matematica' }
      ]
    }
  ],
  '/enem/': [
    {
      text: 'ENEM 2025',
      items: [
        { text: 'Matemática 2025 · Caderno Verde', link: '/enem/2025/matematica' }
      ]
    }
  ],

}

const i18n: ThemeConfig['i18n'] = {
  menu: 'Navegar',          // label in the mobile nav
  toc: 'Nesta página',   // "On this page"
  returnToTop: 'Retornar ao início', // "Return to top"
  appearance: 'Modo de leitura'
}

function inlineScript(file: string): HeadConfig {
  return [
    'script',
    {},
    fs.readFileSync(
      path.resolve(__dirname, `./inlined-scripts/${file}`),
      'utf-8'
    )
  ]
}

export default defineConfigWithTheme<ThemeConfig>({
  extends: baseConfig,

  sitemap: {
    hostname: 'https://skepvox.com',
    transformItems: (items) => {
      const excluded = new Set([
        '/enem/2025/humanas',
        '/enem/2025/linguagens',
        '/enem/2025/natureza',
        '/enem/overrides/README'
      ])

      return items.filter((item) => {
        const rawPath = item.url.startsWith('/') ? item.url : `/${item.url}`
        const path = rawPath.replace(/\.html$/, '')

        return !excluded.has(path)
      })
    }
  },

  lang: 'pt-BR',
  title: 'Skepvox — Engenharia de Letras',
  description: 'Louis Lavelle, Literatura & Filosofia',
  srcDir: 'src',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
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
      copyright: `${new Date().getFullYear()} © Thiago Oliveira`
    }
  },

  markdown: {
    theme: 'github-dark',
    config(md) {
      md.use(markdownItMathjax3)
      md.use(headerPlugin).use(groupIconMdPlugin)
      // .use(textAdPlugin)
    }
  },

  vite: {
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
      groupIconVitePlugin({
        customIcon: {
          cypress: 'vscode-icons:file-type-cypress',
          'testing library': 'logos:testing-library'
        }
      }) as Plugin
    ]
  }
})
