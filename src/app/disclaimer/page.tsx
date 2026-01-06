import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Scale, TrendingUp, User, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Financial Disclaimer | GANO',
  description: 'Important disclaimer regarding the use of GANO services and information.',
};

export default function DisclaimerPage() {
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
          <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={28} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Financial Disclaimer</h1>
            <p className="text-slate-500">Last updated: January 5, 2026</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <Scale size={24} className="text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-semibold text-amber-900 text-lg mb-2">
                Important: Please Read This Disclaimer Carefully
              </h2>
              <p className="text-amber-800">
                GANO provides informational and educational content only. The information
                on this website is not intended to be, and should not be construed as,
                financial advice, investment advice, trading advice, or any other type
                of advice.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-8">
          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText size={20} className="text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                1. Not Financial Advice
              </h2>
            </div>
            <div className="text-slate-600 space-y-3 pl-8">
              <p>
                The content provided by GANO, including but not limited to fragility scores,
                signals, risk assessments, supply chain analysis, and any other information
                or data displayed on our platform, is provided for <strong>informational
                and educational purposes only</strong>.
              </p>
              <p>
                Nothing on this website constitutes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Financial advice</li>
                <li>Investment advice</li>
                <li>Tax advice</li>
                <li>Legal advice</li>
                <li>A recommendation or solicitation to buy or sell any security</li>
                <li>An offer to provide investment advisory services</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={20} className="text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                2. No Guarantees of Performance
              </h2>
            </div>
            <div className="text-slate-600 space-y-3 pl-8">
              <p>
                <strong>Past performance is not indicative of future results.</strong>{' '}
                Historical data, backtests, and track records presented on this website
                do not guarantee future outcomes.
              </p>
              <p>
                GANO makes no representations or warranties, express or implied, regarding:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The accuracy, completeness, or reliability of any information</li>
                <li>The performance of any investment strategy</li>
                <li>Future market conditions or outcomes</li>
                <li>The suitability of any information for your particular circumstances</li>
              </ul>
              <p>
                All investments involve risk, including the potential loss of principal.
                There is no guarantee that any investment strategy will be profitable.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <User size={20} className="text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                3. Your Responsibility
              </h2>
            </div>
            <div className="text-slate-600 space-y-3 pl-8">
              <p>
                <strong>You are solely responsible for your own investment decisions.</strong>{' '}
                Before making any investment decision, you should:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Conduct your own independent research and analysis</li>
                <li>Consider your personal financial situation, investment objectives, and risk tolerance</li>
                <li>Consult with a qualified financial advisor, tax professional, or other appropriate expert</li>
                <li>Understand the risks associated with any investment</li>
              </ul>
              <p>
                By using GANO, you acknowledge that you understand these risks and accept
                full responsibility for any investment decisions you make.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                4. Risk Warning
              </h2>
            </div>
            <div className="text-slate-600 space-y-3 pl-8">
              <p>
                Trading and investing in securities involves substantial risk of loss.
                The value of investments can go down as well as up, and you may receive
                back less than you originally invested.
              </p>
              <p>
                Specific risks include but are not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Market risk: general market conditions may affect the value of investments</li>
                <li>Liquidity risk: some investments may be difficult to sell quickly</li>
                <li>Concentration risk: focusing on specific sectors or stocks may increase volatility</li>
                <li>Model risk: algorithmic predictions may not accurately forecast future events</li>
                <li>Data risk: information used in analysis may be incomplete or inaccurate</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale size={20} className="text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                5. Limitation of Liability
              </h2>
            </div>
            <div className="text-slate-600 space-y-3 pl-8">
              <p>
                To the fullest extent permitted by applicable law, GANO and its affiliates,
                officers, directors, employees, agents, and licensors shall not be liable
                for any direct, indirect, incidental, special, consequential, or punitive
                damages arising out of or related to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use of or reliance on any information provided by GANO</li>
                <li>Any investment decisions you make</li>
                <li>Any losses or damages incurred as a result of trading or investing</li>
                <li>Any errors, omissions, or inaccuracies in the information provided</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText size={20} className="text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                6. Third-Party Information
              </h2>
            </div>
            <div className="text-slate-600 space-y-3 pl-8">
              <p>
                GANO may display information sourced from third parties, including but not
                limited to market data providers, news sources, and financial databases.
                GANO does not verify or guarantee the accuracy of third-party information
                and is not responsible for any errors or omissions in such information.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText size={20} className="text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                7. Changes to This Disclaimer
              </h2>
            </div>
            <div className="text-slate-600 space-y-3 pl-8">
              <p>
                GANO reserves the right to modify this disclaimer at any time. Changes
                will be effective immediately upon posting to this page. Your continued
                use of the website after any changes constitutes your acceptance of the
                modified disclaimer.
              </p>
            </div>
          </section>
        </div>

        {/* Contact */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>
            If you have any questions about this disclaimer, please contact us at{' '}
            <a href="mailto:legal@ganoalpha.com" className="text-indigo-600 hover:underline">
              legal@ganoalpha.com
            </a>
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-8 pt-8 border-t border-slate-200 flex justify-center gap-6 text-sm">
          <Link href="/terms" className="text-slate-600 hover:text-indigo-600">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-slate-600 hover:text-indigo-600">
            Privacy Policy
          </Link>
          <Link href="/cookies" className="text-slate-600 hover:text-indigo-600">
            Cookie Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
