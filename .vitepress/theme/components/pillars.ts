export interface Pillar {
  key: string
  label: string
  href: string
  activeMatch: string
  blurb: string
}

export const PILLARS: Pillar[] = [
  {
    key: 'literatura',
    label: 'Literatura',
    href: '/pt/literatura/',
    activeMatch: '^/pt/literatura/',
    blurb: 'Clássicos que mantenho por perto, em uma biblioteca pessoal que venho construindo.'
  },
  {
    key: 'filosofia',
    label: 'Filosofia',
    href: '/pt/filosofia/',
    activeMatch: '^/pt/filosofia/',
    blurb: 'Textos de filosofia, alguns ainda pouco acessíveis, que venho organizando aos poucos.'
  },
  {
    key: 'vox-francais',
    label: 'Vox Français',
    href: '/podcast/francais/',
    activeMatch: '^/podcast/francais/',
    blurb:
      'Podcast criado para meu próprio estudo, como uma forma de manter contato com a língua e aprimorar meu francês.'
  }
]
