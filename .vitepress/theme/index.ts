import './ssr-shim'
import { h } from 'vue'
import { VPTheme } from '@vue/theme'
import './styles/index.css'
import NavBarTitleBrand from './components/NavBarTitleBrand.vue'
import BufferNotice from './components/BufferNotice.vue'
import PodcastEpisodeNav from './components/PodcastEpisodeNav.vue'
import PipelineWorkContentsMount from './components/PipelineWorkContentsMount.vue'
import PipelineReaderHeader from './components/PipelineReaderHeader.vue'
import ReaderIcon from './components/ReaderIcon.vue'
import BrandMark from './components/BrandMark.vue'
import PipelineSegmentNav from './components/PipelineSegmentNav.vue'
import ThemeChromeSync from './components/ThemeChromeSync.vue'

import 'vitepress/dist/client/theme-default/styles/components/vp-code-group.css'
import 'vitepress/dist/client/theme-default/styles/icons.css'
import 'virtual:group-icons.css'

export default Object.assign({}, VPTheme, {
  Layout: () => {
    // @ts-ignore
    return [
      h(VPTheme.Layout, null, {
        'navbar-title': () => h(NavBarTitleBrand),
        'content-top': () => [
          h(BufferNotice),
          h(PipelineReaderHeader),
          h(PipelineWorkContentsMount)
        ],
        'content-bottom': () => [
          h(PipelineSegmentNav, { placement: 'bottom' }),
          h(PodcastEpisodeNav)
        ]
      }),
      h(ThemeChromeSync)
    ]
  },
  enhanceApp(ctx: { app: { component: (name: string, c: unknown) => void } }) {
    // @ts-ignore - VPTheme may define its own enhanceApp; chain it.
    VPTheme.enhanceApp?.(ctx)
    ctx.app.component('ReaderIcon', ReaderIcon)
    ctx.app.component('BrandMark', BrandMark)
  }
})
