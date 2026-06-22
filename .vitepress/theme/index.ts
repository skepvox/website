import './ssr-shim'
import { h } from 'vue'
import { VPTheme } from '@vue/theme'
import './styles/index.css'
import NavBarTitleBrand from './components/NavBarTitleBrand.vue'
import BufferNotice from './components/BufferNotice.vue'
import ReadingNav from './components/ReadingNav.vue'
import PodcastEpisodeNav from './components/PodcastEpisodeNav.vue'
import WorkContentsMount from './components/WorkContentsMount.vue'
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
  }
})
