export interface CustomTheme {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  success: string
  danger: string
  border: string
}

export interface SavedCustomTheme {
  name: string
  colors: CustomTheme
  createdAt: string
}

const SAVED_CUSTOM_THEMES_KEY = 'saved_custom_themes'

// Color name to hex mapping for all themes
const THEME_COLORS: Record<string, CustomTheme> = {
  dashboard: {
    primary: '#E11D48',
    secondary: '#F43F5E',
    accent: '#FFFFFF',
    background: '#0C0406',
    surface: '#180A0E',
    text: '#FFFFFF',
    success: '#10B981',
    danger: '#FF4D4D',
    border: '#2B1017',
  },
  light: {
    primary: '#4F6BED',
    secondary: '#0EA5A0',
    accent: '#E8910A',
    background: '#F8F8FC',
    surface: '#FFFFFF',
    text: '#1A1A2E',
    success: '#16A34A',
    danger: '#DC2626',
    border: '#E2E4EA',
  },
  dark: {
    primary: '#7C9BF5',
    secondary: '#5EEAD4',
    accent: '#FCD34D',
    background: '#0F1219',
    surface: '#1A1F2E',
    text: '#E8EAF0',
    success: '#4ADE80',
    danger: '#FB7185',
    border: '#2D3348',
  },
  ocean: {
    primary: '#2E8BC0',
    secondary: '#38BDF8',
    accent: '#F0B429',
    background: '#F2F8FC',
    surface: '#FFFFFF',
    text: '#0A2540',
    success: '#10B981',
    danger: '#E54D4D',
    border: '#D0E3F0',
  },
  forest: {
    primary: '#2D8A56',
    secondary: '#7CB342',
    accent: '#D4A017',
    background: '#F4F9F4',
    surface: '#FFFFFF',
    text: '#1B3A26',
    success: '#22C55E',
    danger: '#DC4A4A',
    border: '#C8DFC8',
  },
  sunset: {
    primary: '#D95D1B',
    secondary: '#E8910A',
    accent: '#FFB347',
    background: '#FDF6EE',
    surface: '#FFFFFF',
    text: '#3D2008',
    success: '#4CAF50',
    danger: '#D32F2F',
    border: '#F0D9C0',
  },
  midnight: {
    primary: '#9B7BF7',
    secondary: '#E879F9',
    accent: '#F472B6',
    background: '#0C0A1D',
    surface: '#161433',
    text: '#E4E0F8',
    success: '#4ADE80',
    danger: '#FB7185',
    border: '#302C52',
  },
  berry: {
    primary: '#8B5CF6',
    secondary: '#E879F9',
    accent: '#F43F5E',
    background: '#FBF7FF',
    surface: '#FFFFFF',
    text: '#3B1764',
    success: '#22C55E',
    danger: '#DC2626',
    border: '#E4D4F4',
  },
  coral: {
    primary: '#E76F51',
    secondary: '#F4A261',
    accent: '#E9C46A',
    background: '#FEF5F0',
    surface: '#FFFFFF',
    text: '#3D1E0F',
    success: '#2A9D8F',
    danger: '#D62828',
    border: '#F4DDD2',
  },
  mint: {
    primary: '#0D9488',
    secondary: '#22D3EE',
    accent: '#A3E635',
    background: '#F2FAFA',
    surface: '#FFFFFF',
    text: '#0F3D3A',
    success: '#10B981',
    danger: '#EF4444',
    border: '#C4E8E4',
  },
  'gradient-sunset': {
    primary: '#E8710A',
    secondary: '#D94E1B',
    accent: '#FFD166',
    background: 'linear-gradient(135deg, #1A0A00 0%, #2D1200 50%, #3D1800 100%)',
    surface: '#2D1608',
    text: '#FFF0E0',
    success: '#4ADE80',
    danger: '#FB7185',
    border: '#5C3018',
  },
  'gradient-midnight': {
    primary: '#A78BFA',
    secondary: '#C084FC',
    accent: '#F0ABFC',
    background: 'linear-gradient(135deg, #0C0A1D 0%, #1A1145 50%, #1E1650 100%)',
    surface: '#1E1650',
    text: '#E8E0FF',
    success: '#4ADE80',
    danger: '#FB7185',
    border: '#3D2E6B',
  },
  'gradient-ocean': {
    primary: '#38BDF8',
    secondary: '#22D3EE',
    accent: '#67E8F9',
    background: 'linear-gradient(135deg, #020B18 0%, #0A1E38 50%, #0F2845 100%)',
    surface: '#0F2845',
    text: '#D4F0FF',
    success: '#4ADE80',
    danger: '#FB7185',
    border: '#1E3D5C',
  },
  'gradient-forest': {
    primary: '#4ADE80',
    secondary: '#86EFAC',
    accent: '#BEF264',
    background: 'linear-gradient(135deg, #030F08 0%, #0A2618 50%, #0F3320 100%)',
    surface: '#0F3320',
    text: '#D4F5E0',
    success: '#22C55E',
    danger: '#FB7185',
    border: '#1A5C35',
  },
  'gradient-berry': {
    primary: '#E879F9',
    secondary: '#F0ABFC',
    accent: '#FB7185',
    background: 'linear-gradient(135deg, #140820 0%, #2D1050 50%, #3B1468 100%)',
    surface: '#2D1050',
    text: '#F5E0FF',
    success: '#4ADE80',
    danger: '#FB7185',
    border: '#5C2080',
  },
  strawberry: {
    primary: '#EA6F9C',
    secondary: '#C6B0F2',
    accent: '#8AA3E8',
    background: 'linear-gradient(180deg, #FFF6FB 0%, #F8EBF5 44%, #F2EDFF 100%)',
    surface: '#FFFDFE',
    text: '#273043',
    success: '#25C08E',
    danger: '#E35D75',
    border: '#E8D9E8',
  },
  monsoon: {
    primary: '#60A5FA',
    secondary: '#38BDF8',
    accent: '#A5F3FC',
    background: 'linear-gradient(180deg, #EAF6FF 0%, #D9EEF9 52%, #C7E4F4 100%)',
    surface: '#F7FBFF',
    text: '#16324F',
    success: '#14B8A6',
    danger: '#E11D48',
    border: '#C5DDF0',
  },
  'black-hole': {
    primary: '#A855F7',
    secondary: '#22D3EE',
    accent: '#F8FAFC',
    background: 'linear-gradient(180deg, #050816 0%, #090B22 55%, #020308 100%)',
    surface: '#10162B',
    text: '#F5F3FF',
    success: '#4ADE80',
    danger: '#FB7185',
    border: '#28314A',
  },
  mochi: {
    primary: '#F9A8D4',
    secondary: '#FDBA74',
    accent: '#93C5FD',
    background: 'linear-gradient(180deg, #FFF8FB 0%, #FFF0F8 48%, #FFFDF5 100%)',
    surface: '#FFFFFF',
    text: '#5B3A55',
    success: '#34D399',
    danger: '#FB7185',
    border: '#F3D6E7',
  },
  tsunami: {
    primary: '#0EA5E9',
    secondary: '#22C55E',
    accent: '#67E8F9',
    background: 'linear-gradient(180deg, #E8FAFF 0%, #DDF6FF 48%, #C8F0FF 100%)',
    surface: '#F6FDFF',
    text: '#0A344A',
    success: '#10B981',
    danger: '#E11D48',
    border: '#C4E8F6',
  },
  matcha: {
    primary: '#22C55E',
    secondary: '#84CC16',
    accent: '#D9F99D',
    background: 'linear-gradient(180deg, #F7FBF4 0%, #EDF7E8 52%, #E2F0DB 100%)',
    surface: '#FCFEFB',
    text: '#243B2A',
    success: '#16A34A',
    danger: '#DC2626',
    border: '#D7E6D2',
  },
  'bubble-pop': {
    primary: '#A78BFA',
    secondary: '#67E8F9',
    accent: '#F9A8D4',
    background: 'linear-gradient(180deg, #FBFAFF 0%, #F5F3FF 50%, #EEF9FF 100%)',
    surface: '#FFFFFF',
    text: '#2F2C57',
    success: '#34D399',
    danger: '#FB7185',
    border: '#E3DEF8',
  },
  'meteor-shower': {
    primary: '#F59E0B',
    secondary: '#FB7185',
    accent: '#E879F9',
    background: 'linear-gradient(180deg, #120A1F 0%, #1A1035 52%, #0B0A13 100%)',
    surface: '#1D1632',
    text: '#F3E8FF',
    success: '#4ADE80',
    danger: '#FB7185',
    border: '#382B58',
  },
  arcane: {
    primary: '#8B5CF6',
    secondary: '#D946EF',
    accent: '#C084FC',
    background: 'linear-gradient(180deg, #120C22 0%, #20103A 48%, #090711 100%)',
    surface: '#1C1230',
    text: '#F4EEFF',
    success: '#4ADE80',
    danger: '#FB7185',
    border: '#3A2959',
  },
}

export const getThemeColors = (themeName: string, customTheme?: CustomTheme) => {
  if (themeName === 'custom' && customTheme) return customTheme
  return THEME_COLORS[themeName] || THEME_COLORS.dashboard
}

export const loadSavedCustomThemes = (): SavedCustomTheme[] => {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(SAVED_CUSTOM_THEMES_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveCustomThemePreset = (theme: SavedCustomTheme) => {
  if (typeof window === 'undefined') return

  const existing = loadSavedCustomThemes()
  const next = [theme, ...existing.filter((item) => item.name.toLowerCase() !== theme.name.toLowerCase())]
  localStorage.setItem(SAVED_CUSTOM_THEMES_KEY, JSON.stringify(next))
}

export const deleteCustomThemePreset = (themeName: string) => {
  if (typeof window === 'undefined') return

  const existing = loadSavedCustomThemes()
  const next = existing.filter((theme) => theme.name.toLowerCase() !== themeName.toLowerCase())
  localStorage.setItem(SAVED_CUSTOM_THEMES_KEY, JSON.stringify(next))
}

export const applyTheme = (themeName: string, customTheme?: CustomTheme) => {
  const root = document.documentElement
  const htmlElement = document.querySelector('html') || root
  const body = document.body
  const colors = getThemeColors(themeName, customTheme)
  
  // Remove all theme classes from html
  htmlElement.classList.remove(
    'light', 'dark', 'ocean', 'forest', 'sunset', 'midnight', 'berry', 'coral', 'mint', 'dashboard', 'strawberry',
    'monsoon', 'black-hole', 'mochi', 'tsunami', 'matcha', 'bubble-pop', 'meteor-shower', 'arcane',
    'gradient-sunset', 'gradient-midnight', 'gradient-ocean', 'gradient-forest', 'gradient-berry', 'custom'
  )
  
  // Add the new theme class to html
  htmlElement.classList.add(themeName === 'custom' ? 'custom' : themeName)
  
  // Apply colors to CSS variables on root
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value)
  })
  
  // Apply background directly to body
  body.style.background = colors.background
  body.style.color = colors.text
  
  console.log('✅ Theme applied:', themeName, colors)
  
  // Save to localStorage
  localStorage.setItem('theme', themeName)
  if (customTheme) {
    localStorage.setItem('customTheme', JSON.stringify(customTheme))
  }
}

export const loadTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'dashboard'
  const savedCustomTheme = localStorage.getItem('customTheme')
  
  if (savedTheme === 'custom' && savedCustomTheme) {
    try {
      const customTheme = JSON.parse(savedCustomTheme)
      applyTheme('custom', customTheme)
    } catch (e) {
      applyTheme('dashboard')
    }
  } else {
    applyTheme(savedTheme)
  }
}

// Apply theme on page load
if (typeof window !== 'undefined') {
  loadTheme()
}
