import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Cookie, Shield, BarChart3, Megaphone, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy | GANO',
  description: 'Learn about how GANO uses cookies and how to manage your preferences.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Cookie size={28} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1>
            <p className="text-slate-500">Last updated: January 5, 2026</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              What Are Cookies?
            </h2>
            <div className="text-slate-600 space-y-3">
              <p>
                Cookies are small text files that are stored on your device when you visit
                a website. They are widely used to make websites work more efficiently,
                provide analytics, and remember your preferences.
              </p>
              <p>
                This Cookie Policy explains what cookies we use, why we use them, and how
                you can manage your cookie preferences.
              </p>
            </div>
          </section>

          {/* Cookie Categories */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              Types of Cookies We Use
            </h2>

            {/* Necessary */}
            <div className="border border-slate-200 rounded-lg p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield size={20} className="text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900">Necessary Cookies</h3>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                      Always Active
                    </span>
                  </div>
                  <p className="text-slate-600 mb-4">
                    These cookies are essential for the website to function properly. They enable
                    core functionality such as security, network management, and accessibility.
                    You cannot disable these cookies as the website would not function properly
                    without them.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 text-slate-500 font-medium">Cookie</th>
                        <th className="text-left py-2 text-slate-500 font-medium">Purpose</th>
                        <th className="text-left py-2 text-slate-500 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-mono text-xs">gano_session</td>
                        <td className="py-2">Maintains your login session</td>
                        <td className="py-2">Session</td>
                      </tr>
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-mono text-xs">gano_cookie_consent</td>
                        <td className="py-2">Stores your cookie preferences</td>
                        <td className="py-2">1 year</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-xs">csrf_token</td>
                        <td className="py-2">Prevents cross-site request forgery</td>
                        <td className="py-2">Session</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="border border-slate-200 rounded-lg p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900">Analytics Cookies</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  </div>
                  <p className="text-slate-600 mb-4">
                    These cookies help us understand how visitors interact with our website.
                    They collect information about page views, traffic sources, and user behavior.
                    This data helps us improve our services and user experience. All data is
                    aggregated and anonymous.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 text-slate-500 font-medium">Cookie</th>
                        <th className="text-left py-2 text-slate-500 font-medium">Purpose</th>
                        <th className="text-left py-2 text-slate-500 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      <tr className="border-b border-slate-50">
                        <td className="py-2 font-mono text-xs">_vercel_insights</td>
                        <td className="py-2">Vercel Analytics - page views and performance</td>
                        <td className="py-2">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Marketing */}
            <div className="border border-slate-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Megaphone size={20} className="text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900">Marketing Cookies</h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      Optional
                    </span>
                  </div>
                  <p className="text-slate-600 mb-4">
                    These cookies are used to track visitors across websites to display relevant
                    advertisements. Currently, GANO does not use marketing cookies. If this
                    changes in the future, we will update this policy and request your consent.
                  </p>
                  <p className="text-sm text-slate-400 italic">
                    No marketing cookies are currently in use.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Settings size={20} className="text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                Managing Your Cookie Preferences
              </h2>
            </div>
            <div className="text-slate-600 space-y-3">
              <p>
                When you first visit our website, you will be shown a cookie consent banner
                that allows you to accept or reject non-essential cookies. You can change
                your preferences at any time by clicking the &quot;Cookie Settings&quot; link
                in the footer of any page.
              </p>
              <p>
                You can also control cookies through your browser settings. Most browsers
                allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>View what cookies are stored on your device</li>
                <li>Delete all or specific cookies</li>
                <li>Block cookies from specific or all websites</li>
                <li>Block third-party cookies</li>
                <li>Set your browser to notify you when a cookie is set</li>
              </ul>
              <p>
                Please note that blocking necessary cookies may prevent parts of the website
                from functioning correctly.
              </p>
            </div>
          </section>

          {/* Browser Links */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Browser Cookie Settings
            </h2>
            <div className="text-slate-600 space-y-3">
              <p>
                For instructions on how to manage cookies in your browser, please visit:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Updates to This Policy
            </h2>
            <div className="text-slate-600 space-y-3">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in
                our practices or for other operational, legal, or regulatory reasons.
                If we make significant changes, we will notify you by displaying a prominent
                notice on our website or by updating the consent banner.
              </p>
              <p>
                Please review this policy periodically to stay informed about how we use cookies.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Contact Us
            </h2>
            <div className="text-slate-600">
              <p>
                If you have any questions about our use of cookies, please contact us at{' '}
                <a href="mailto:privacy@ganoalpha.com" className="text-indigo-600 hover:underline">
                  privacy@ganoalpha.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-8 pt-8 border-t border-slate-200 flex justify-center gap-6 text-sm">
          <Link href="/terms" className="text-slate-600 hover:text-indigo-600">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-slate-600 hover:text-indigo-600">
            Privacy Policy
          </Link>
          <Link href="/disclaimer" className="text-slate-600 hover:text-indigo-600">
            Financial Disclaimer
          </Link>
        </div>
      </div>
    </div>
  );
}
