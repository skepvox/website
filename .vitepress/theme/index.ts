import './ssr-shim'
import { h } from 'vue'
import { VPTheme } from '@vue/theme'
import './styles/index.css'
import NavBarTitleBrand from './components/NavBarTitleBrand.vue'
import BufferNotice from './components/BufferNotice.vue'
import ReadingNav from './components/ReadingNav.vue'
import PodcastEpisodeNav from './components/PodcastEpisodeNav.vue'
import WorkContentsMount from './components/WorkContentsMount.vue'
import PipelineExportReview from './components/PipelineExportReview.vue'
import PipelineSegmentPreview from './components/PipelineSegmentPreview.vue'
import PipelineWindowPreview from './components/PipelineWindowPreview.vue'
import PipelineReaderPreview from './components/PipelineReaderPreview.vue'
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
          h(ReadingNav, { placement: 'top' }),
          h(WorkContentsMount)
        ],
        'content-bottom': () => [h(ReadingNav, { placement: 'bottom' }), h(PodcastEpisodeNav)]
      }),
      h(ThemeChromeSync)
    ]
  },
  // Review-only consumer of the vendored pipeline export, used solely on the buffer page
  // src/reading-review/introduction-a-l-ontologie.md (Slice 2C). Registered globally so the
  // markdown page can render it; mounted on no live work hub.
  enhanceApp(ctx: { app: { component: (name: string, c: unknown) => void } }) {
    // @ts-ignore - VPTheme may define its own enhanceApp; chain it.
    VPTheme.enhanceApp?.(ctx)
    ctx.app.component('PipelineExportReview', PipelineExportReview)
    ctx.app.component('PipelineSegmentPreview', PipelineSegmentPreview)
    ctx.app.component('PipelineWindowPreview', PipelineWindowPreview)
    ctx.app.component('PipelineReaderPreview', PipelineReaderPreview)
  }
})
