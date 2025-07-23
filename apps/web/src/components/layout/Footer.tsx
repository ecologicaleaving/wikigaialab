'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Linkedin, Github, Mail } from 'lucide-react';
import { footerNavigation } from '@/lib/navigation';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200" id="footer">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand and Mission */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative w-8 h-8">
                <Image
                  src="/images/wikigaialab-logo.svg"
                  alt="WikiGaiaLab"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-primary-900">
                WikiGaiaLab
              </span>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Innovazione sociale e tecnologia per il bene comune. 
              Una piattaforma community che democratizza lo sviluppo di soluzioni AI.
            </p>
            
            {/* Partnership Logos */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">In partnership con:</p>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="relative w-20 h-10 mb-2">
                    <Image
                      src="/images/ass-gaia-logo.png"
                      alt="Ass.Gaia"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Community Partner</p>
                </div>
                <div className="text-center">
                  <div className="relative w-20 h-10 mb-2">
                    <Image
                      src="/images/ecologicaleaving-logo.png"
                      alt="Ecologicaleaving"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Technology Partner</p>
                </div>
              </div>
            </div>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{footerNavigation.community.title}</h3>
            <ul className="space-y-2 text-sm">
              {footerNavigation.community.links.map(link => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    prefetch={false}
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{footerNavigation.support.title}</h3>
            <ul className="space-y-2 text-sm">
              {footerNavigation.support.links.map(link => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    prefetch={false}
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{footerNavigation.resources.title}</h3>
            <ul className="space-y-2 text-sm">
              {footerNavigation.resources.links.map(link => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    prefetch={false}
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-500 text-center sm:text-left">
              © {currentYear} WikiGaiaLab. Tutti i diritti riservati.
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a
                href="https://twitter.com/wikigaialab"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://facebook.com/wikigaialab"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://instagram.com/wikigaialab"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://linkedin.com/company/wikigaialab"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://github.com/wikigaialab"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-600 transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="mailto:info@wikigaialab.org"
                className="text-gray-400 hover:text-primary-600 transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-gray-500">
            <Link href="/privacy" prefetch={false} className="hover:text-primary-600 transition-colors">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/terms" prefetch={false} className="hover:text-primary-600 transition-colors">
              Termini di Servizio
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/cookies" prefetch={false} className="hover:text-primary-600 transition-colors">
              Cookie Policy
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/gdpr" prefetch={false} className="hover:text-primary-600 transition-colors">
              GDPR
            </Link>
            <span className="hidden sm:inline">·</span>
            <Link href="/accessibility" prefetch={false} className="hover:text-primary-600 transition-colors">
              Accessibilità
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};