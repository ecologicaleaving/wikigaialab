'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: 'h',
    alt: true,
    action: () => window.location.href = '/',
    description: 'Vai alla Home'
  },
  {
    key: 'p',
    alt: true,
    action: () => window.location.href = '/problems',
    description: 'Vai ai Problemi'
  },
  {
    key: 'a',
    alt: true,
    action: () => window.location.href = '/apps',
    description: 'Vai alle App'
  },
  {
    key: 'u',
    alt: true,
    action: () => window.location.href = '/profile',
    description: 'Vai al Profilo'
  },
  {
    key: '/',
    ctrl: true,
    action: () => {
      const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: 'Cerca'
  },
  {
    key: 'Escape',
    action: () => {
      // Close any open modals or menus
      const closeButtons = document.querySelectorAll('[data-close-modal], [data-close-menu]');
      closeButtons.forEach(button => {
        (button as HTMLElement).click();
      });
    },
    description: 'Chiudi menu/modal'
  }
];

export const useKeyboardNavigation = (customShortcuts?: KeyboardShortcut[]) => {
  const router = useRouter();
  const shortcuts = customShortcuts || defaultShortcuts;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable) {
        return;
      }

      shortcuts.forEach(shortcut => {
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && altMatch && ctrlMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return shortcuts;
};

// Hook for focus management
export const useFocusTrap = (containerRef: React.RefObject<HTMLElement>, isActive: boolean) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
};