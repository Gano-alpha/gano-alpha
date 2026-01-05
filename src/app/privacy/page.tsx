'use client';

import { useState, useEffect } from 'react';
import { getPrivacyPolicy, getDataRetentionInfo, type LegalDocument, type DataRetentionInfo } from '@/lib/api';
import { LegalDocumentView, DataRetentionTable } from '@/components/legal';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [dataRetention, setDataRetention] = useState<DataRetentionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [privacyData, retentionData] = await Promise.all([
          getPrivacyPolicy(),
          getDataRetentionInfo(),
        ]);
        setDocument(privacyData);
        setDataRetention(retentionData);
      } catch (err) {
        console.error('Failed to fetch Privacy Policy:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Privacy Policy');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </Link>
              <a href="/" className="text-xl font-bold text-slate-900">
                GANO Alpha
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-sm text-slate-600 hover:text-slate-900">
                Terms of Service
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw size={32} className="animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {document && <LegalDocumentView document={document} />}

          {/* Data Retention Section */}
          {dataRetention.length > 0 && (
            <div className="max-w-4xl mx-auto px-8 py-8">
              <DataRetentionTable data={dataRetention} />
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} GANO Alpha. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-slate-900">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
              <a href="mailto:privacy@gano-reasoner.com" className="hover:text-slate-900">Contact DPO</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
