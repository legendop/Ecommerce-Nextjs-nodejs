import { theme } from './theme.config';

/**
 * Utility functions for working with the theme
 */

/**
 * Get a color from the theme by path
 * Usage: getColor('brand.pink') or getColor('gray.500')
 */
export function getColor(path: string): string {
  const parts = path.split('.');
  let value: unknown = theme.colors;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      console.warn(`Color path not found: ${path}`);
      return '';
    }
  }

  return typeof value === 'string' ? value : '';
}

/**
 * Get spacing value
 * Usage: getSpacing('md') -> '1rem'
 */
export function getSpacing(size: keyof typeof theme.spacing): string {
  return theme.spacing[size];
}

/**
 * Get border radius
 * Usage: getRadius('lg') -> '0.75rem'
 */
export function getRadius(size: keyof typeof theme.radius): string {
  return theme.radius[size];
}

/**
 * Get shadow
 * Usage: getShadow('md')
 */
export function getShadow(size: keyof typeof theme.shadows): string {
  return theme.shadows[size];
}

/**
 * Get font size
 * Usage: getFontSize('xl')
 */
export function getFontSize(size: keyof typeof theme.typography.fontSize): string {
  return theme.typography.fontSize[size];
}

/**
 * Get transition
 * Usage: getTransition('fast')
 */
export function getTransition(speed: keyof typeof theme.transitions): string {
  return theme.transitions[speed];
}

/**
 * Create a CSS variable string for a theme value
 * Usage: cssVar('colors.brand.pink') -> 'var(--colors-brand-pink)'
 */
export function cssVar(path: string): string {
  return `var(--${path.replace(/\./g, '-')})`;
}

/**
 * Generate CSS custom properties from theme
 * This can be used to inject theme variables into CSS
 */
export function generateCSSVariables(): string {
  const vars: string[] = [];

  // Helper to flatten nested objects
  const flatten = (obj: Record<string, unknown>, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}-${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flatten(value as Record<string, unknown>, newKey);
      } else if (typeof value === 'string' || typeof value === 'number') {
        vars.push(`  --${newKey}: ${value};`);
      }
    }
  };

  flatten(theme.colors, 'colors');
  flatten(theme.spacing, 'spacing');
  flatten(theme.radius, 'radius');
  flatten(theme.shadows, 'shadows');

  return `:root {\n${vars.join('\n')}\n}`;
}

/**
 * Check if a color is light or dark
 * Useful for determining text color on backgrounds
 */
export function isLightColor(color: string): boolean {
  // Remove # and convert to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5;
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}

/**
 * Apply alpha to a hex color
 * Usage: hexWithAlpha('#ec93c9', 0.5) -> 'rgba(236, 147, 201, 0.5)'
 */
export function hexWithAlpha(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
