// Theme management utility
// Handles System/Light/Dark mode with localStorage persistence

const THEME_KEY = 'rove_theme_preference'; // 'system' | 'light' | 'dark'
const DARK_CLASS = 'dark';

export function getThemePreference() {
  return localStorage.getItem(THEME_KEY) || 'system';
}

export function setThemePreference(preference) {
  localStorage.setItem(THEME_KEY, preference);
  applyTheme(preference);
}

function isSystemDarkMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(preference) {
  const isDark = preference === 'dark' || (preference === 'system' && isSystemDarkMode());
  
  if (isDark) {
    document.documentElement.classList.add(DARK_CLASS);
  } else {
    document.documentElement.classList.remove(DARK_CLASS);
  }
}

export function initializeTheme() {
  const preference = getThemePreference();
  applyTheme(preference);
  
  // Only set up listener if system preference is selected
  if (preference === 'system') {
    setupSystemListener();
  }
}

function setupSystemListener() {
  // Listen for system theme changes only when 'system' is selected
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Modern API (addEventListener)
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', (e) => {
      const preference = getThemePreference();
      if (preference === 'system') {
        applyTheme('system');
      }
    });
  }
  // Legacy API (addListener) - for older browsers
  else if (mediaQuery.addListener) {
    mediaQuery.addListener(() => {
      const preference = getThemePreference();
      if (preference === 'system') {
        applyTheme('system');
      }
    });
  }
}