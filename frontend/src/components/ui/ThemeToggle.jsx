import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      style={{
        borderColor: 'var(--border-color, #e5e7eb)',
        backgroundColor: 'var(--bg-secondary, transparent)',
        color: 'var(--text-primary, #374151)',
        '--tw-ring-color': 'var(--procon-primary, #3b82f6)'
      }}
      title={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      aria-label={isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  );
}