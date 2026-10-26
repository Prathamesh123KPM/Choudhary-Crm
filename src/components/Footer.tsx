import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface FooterProps {
  onSelectTab?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const { theme } = useTheme();

  return (
    <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-600 dark:text-neutral-400 py-6 px-4 sm:px-6 transition-colors duration-200">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-4">
          <div className="h-12 sm:h-14 w-28 sm:w-36 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={theme === 'dark' ? '/logo.webp' : '/logo-black.webp'}
              alt="Choudhary Real Estate Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                Choudhary Real Estate CRM
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                PROD
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Enterprise Sales Pipeline, Meta Lead Ingestion & Client Management
            </p>
          </div>
        </div>

        {/* Quick Nav & System Info */}
        <div className="flex flex-wrap items-center gap-6 text-xs">
          {onSelectTab && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => onSelectTab('dashboard')}
                className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                Dashboard
              </button>
              <button
                onClick={() => onSelectTab('leads')}
                className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                Leads
              </button>
              <button
                onClick={() => onSelectTab('followups')}
                className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                Follow-ups
              </button>
              <button
                onClick={() => onSelectTab('visits')}
                className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                Site Visits
              </button>
            </div>
          )}

          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />

          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white animate-pulse" />
            <span>Systems Normal</span>
          </div>

          <div className="text-neutral-400 dark:text-neutral-500">
            © {new Date().getFullYear()} Choudhary Estate.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
