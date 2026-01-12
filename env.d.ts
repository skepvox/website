/// <reference types="vitepress/client" />

declare module '@vue/theme/config' {
  import { UserConfig } from 'vitepress'
  const config: () => Promise<UserConfig>
  export default config
}

declare module '@vue/theme/highlight' {
  const createHighlighter: () => Promise<(input: string) => string>
  export default createHighlighter
}

declare module '@mathjax/src' {
  const MathJax: { init: (options: unknown) => Promise<unknown> }
  export default MathJax
}

declare module 'katex/dist/contrib/copy-tex.js' {
  const copyTex: unknown
  export default copyTex
}
