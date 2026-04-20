import './ssr-shim'
import 'katex/dist/katex.min.css'
import './styles/index.css'
import { h, App } from 'vue'
import { VPTheme } from '@vue/theme'
import VueSchoolLink from './components/VueSchoolLink.vue'
import ScrimbaLink from './components/ScrimbaLink.vue'
// import Banner from './components/Banner.vue'
// import TextAd from './components/TextAd.vue'
import NavBarTitleBrand from './components/NavBarTitleBrand.vue'

import 'vitepress/dist/client/theme-default/styles/components/vp-code-group.css'
import 'virtual:group-icons.css'

if (typeof window !== 'undefined') {
  import('katex/dist/contrib/copy-tex.js')
}

export default Object.assign({}, VPTheme, {
  Layout: () => {
    // @ts-ignore
    return h(VPTheme.Layout, null, {
      // banner: () => h(Banner),
      'navbar-title': () => h(NavBarTitleBrand)
    })
  },
  enhanceApp({ app }: { app: App }) {
    app.component('VueSchoolLink', VueSchoolLink)
    app.component('ScrimbaLink', ScrimbaLink)
    // app.component('TextAd', TextAd)
  }
})
