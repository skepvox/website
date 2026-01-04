import './ssr-shim'
import 'katex/dist/katex.min.css'
import './styles/index.css'
import { h, App } from 'vue'
import { VPTheme } from '@vue/theme'
import VueSchoolLink from './components/VueSchoolLink.vue'
import ScrimbaLink from './components/ScrimbaLink.vue'
import QuestionCard from './components/enem/QuestionCard.vue'
import QuestionCardLoader from './components/enem/QuestionCardLoader.vue'
import QuestionPreviewCard from './components/enem/QuestionPreviewCard.vue'
import AssetChart from './components/enem/assets/AssetChart.vue'
// import Banner from './components/Banner.vue'
// import TextAd from './components/TextAd.vue'
import NavBarTitleSkepvox from './components/NavBarTitleSkepvox.vue'

import 'vitepress/dist/client/theme-default/styles/components/vp-code-group.css'
import 'virtual:group-icons.css'

if (typeof window !== 'undefined') {
  import('katex/dist/contrib/copy-tex.js')
  import('@vercel/analytics').then(({ inject }) => inject())
  import('@vercel/speed-insights').then(({ inject }) => inject())
}

export default Object.assign({}, VPTheme, {
  Layout: () => {
    // @ts-ignore
    return h(VPTheme.Layout, null, {
      // banner: () => h(Banner),
      'navbar-title': () => h(NavBarTitleSkepvox)
    })
  },
  enhanceApp({ app }: { app: App }) {
    app.component('VueSchoolLink', VueSchoolLink)
    app.component('ScrimbaLink', ScrimbaLink)
    app.component('QuestionCard', QuestionCard)
    app.component('QuestionCardLoader', QuestionCardLoader)
    app.component('QuestionPreviewCard', QuestionPreviewCard)
    app.component('AssetChart', AssetChart)
    // app.component('TextAd', TextAd)
  }
})
