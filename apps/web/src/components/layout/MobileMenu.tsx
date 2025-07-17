'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, LogOut } from 'lucide-react';
import { MobileMenuProps } from '@/types/navigation';
import { MobileNavigationLink } from './NavigationLink';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';
import { useLogout } from '@/hooks/useAuth';

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  navigationItems,
  user
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout, isLoggingOut } = useLogout();

  // Minimum swipe distance for gesture (in px)
  const minSwipeDistance = 50;

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // If menu is open and user swipes left (from right edge), close menu
    if (isLeftSwipe && isOpen) {
      onClose();
    }
  };

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => {
        document.body.style.overflow = '';
        setIsAnimating(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle logout
  const handleLogout = async () => {
    onClose();
    await logout();
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Menu mobile"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Chiudi menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1">
            {navigationItems.map(item => (
              <MobileNavigationLink
                key={item.id}
                href={item.href}
                icon={item.icon}
                badge={item.badge}
                onClick={onClose}
              >
                {item.label}
              </MobileNavigationLink>
            ))}
          </div>

          {/* Additional Links */}
          {user && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-1">
              <MobileNavigationLink
                href="/settings"
                onClick={onClose}
              >
                Impostazioni
              </MobileNavigationLink>
              <MobileNavigationLink
                href="/help"
                onClick={onClose}
              >
                Centro Aiuto
              </MobileNavigationLink>
            </div>
          )}
        </nav>

        {/* User Section / Auth */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          {user ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || user.email}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{(user.name || user.email || '').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name || 'Utente'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Disconnessione...' : 'Esci'}</span>
              </button>
            </div>
          ) : (
            <GoogleLoginButton className="w-full" />
          )}
        </div>
      </div>
    </>
  );
};