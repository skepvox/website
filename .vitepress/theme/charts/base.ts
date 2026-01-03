import type { ChartTheme } from './types'

const fallbackTheme: ChartTheme = {
  textColor: '#1f1f1f',
  mutedTextColor: '#6b6b6b',
  axisColor: '#8a8a8a',
  gridColor: '#d0d0d0',
  fontFamily: 'inherit'
}

export const readChartTheme = (source?: Element | null): ChartTheme => {
  if (typeof window === 'undefined') {
    return fallbackTheme
  }
  const target = source ?? document.body ?? document.documentElement
  const styles = getComputedStyle(target)
  const textColor = styles.getPropertyValue('--vt-c-text-1').trim() || fallbackTheme.textColor
  const mutedTextColor =
    styles.getPropertyValue('--vt-c-text-2').trim() || fallbackTheme.mutedTextColor
  const axisColor =
    styles.getPropertyValue('--vt-c-text-3').trim() || fallbackTheme.axisColor
  const gridColor =
    styles.getPropertyValue('--vt-c-divider-light').trim() || fallbackTheme.gridColor
  const fontFamily =
    styles.getPropertyValue('--vt-font-family-base').trim() || fallbackTheme.fontFamily
  return {
    textColor,
    mutedTextColor,
    axisColor,
    gridColor,
    fontFamily
  }
}
