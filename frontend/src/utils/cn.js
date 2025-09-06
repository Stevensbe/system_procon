import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário para combinar classes CSS condicionalmente
 * Combina clsx e tailwind-merge para melhor performance
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
