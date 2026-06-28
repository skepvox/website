export type BrandMarkName = 'literatura' | 'filosofia' | 'vox-francais' | 'play' | 'pause'

export const BRAND_MARK_PATHS: Record<BrandMarkName, string> = {
  literatura: 'M9 5h6M12 5v14M9 19h6',
  filosofia: 'M9.5 5v14M9.5 12h6.5',
  'vox-francais': 'M12 8.5v10.5M10 6l4-2',
  play: 'M9 6v12l9-6z',
  pause: 'M8 5.5h3v13H8z M13 5.5h3v13h-3z'
}

export const FILLED_BRAND_MARKS: ReadonlySet<BrandMarkName> = new Set(['play', 'pause'])
