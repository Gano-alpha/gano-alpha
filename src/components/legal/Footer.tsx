'use client';

import Link from 'next/link';
import { CookiePreferencesButton } from './CookieConsent';

interface FooterProps {
  className?: string;
}

/**
 * Site Footer with Legal Links (B20, B21)
 *
 * Includes:
 * - Financial disclaimer link (required on every page)
 * - Cookie settings button
 * - Terms, Privacy, and other legal links
 */
export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-slate-900 text-slate-400 ${className || ''}`}>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Disclaimer Banner */}
        <div className="text-center text-xs text-slate-500 mb-6 pb-6 border-b border-slate-800">
          <p>
            <strong className="text-slate-400">Important:</strong>{' '}
            GANO provides informational content only, not financial advice.
            Past performance does not guarantee future results.{' '}
            <Link href="/disclaimer" className="text-indigo-400 hover:underline">
              Read full disclaimer
            </Link>
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Product */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-slate-200 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-slate-200 transition-colors">
                  Chat
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-slate-200 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <a href="mailto:contact@ganoalpha.com" className="hover:text-slate-200 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-slate-200 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-slate-200 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-slate-200 transition-colors">
                  Financial Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-slate-200 transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Settings */}
          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Preferences</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <CookiePreferencesButton className="text-slate-400 hover:text-slate-200" />
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">GANO</span>
            <span className="text-xs text-slate-500">Structural Alpha Engine</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {currentYear} Gano Alpha Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Compact footer for minimal pages
 */
export function FooterCompact({ className }: FooterProps) {
  return (
    <footer className={`py-6 text-center text-sm text-slate-500 ${className || ''}`}>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/disclaimer" className="hover:text-slate-700">
          Disclaimer
        </Link>
        <span className="text-slate-300">|</span>
        <Link href="/terms" className="hover:text-slate-700">
          Terms
        </Link>
        <span className="text-slate-300">|</span>
        <Link href="/privacy" className="hover:text-slate-700">
          Privacy
        </Link>
        <span className="text-slate-300">|</span>
        <Link href="/cookies" className="hover:text-slate-700">
          Cookies
        </Link>
        <span className="text-slate-300">|</span>
        <CookiePreferencesButton />
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Not financial advice. Past performance does not guarantee future results.
      </p>
    </footer>
  );
}
