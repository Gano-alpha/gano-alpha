'use client';

import { cn } from '@/lib/utils';
import type { LegalDocument } from '@/lib/api';
import { FileText, Calendar, Tag } from 'lucide-react';

interface LegalDocumentViewProps {
  document: LegalDocument;
  className?: string;
}

export function LegalDocumentView({ document, className }: LegalDocumentViewProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Escape HTML to prevent XSS attacks
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Apply markdown formatting (bold/italic) to escaped text
  const applyFormatting = (text: string): string => {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-800">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  };

  // Simple markdown-to-HTML conversion for legal documents
  const renderMarkdown = (content: string) => {
    // Process content line by line
    const lines = content.split('\n');
    const html: string[] = [];
    let inList = false;
    let inTable = false;
    let tableRows: string[] = [];

    lines.forEach((line) => {
      // Headers
      if (line.startsWith('# ')) {
        if (inList) { html.push('</ul>'); inList = false; }
        html.push(`<h1 class="text-3xl font-bold text-slate-900 mt-8 mb-4">${escapeHtml(line.slice(2))}</h1>`);
      } else if (line.startsWith('## ')) {
        if (inList) { html.push('</ul>'); inList = false; }
        html.push(`<h2 class="text-2xl font-semibold text-slate-800 mt-6 mb-3">${escapeHtml(line.slice(3))}</h2>`);
      } else if (line.startsWith('### ')) {
        if (inList) { html.push('</ul>'); inList = false; }
        html.push(`<h3 class="text-xl font-medium text-slate-700 mt-4 mb-2">${escapeHtml(line.slice(4))}</h3>`);
      }
      // Blockquote (draft notice)
      else if (line.startsWith('> ')) {
        const text = applyFormatting(line.slice(2));
        html.push(`<div class="border-l-4 border-amber-400 bg-amber-50 pl-4 py-2 my-4 text-amber-800">${text}</div>`);
      }
      // Table row
      else if (line.startsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);
      }
      // List items
      else if (line.startsWith('- ')) {
        if (!inList) {
          html.push('<ul class="list-disc list-inside space-y-1 my-3 text-slate-600">');
          inList = true;
        }
        html.push(`<li>${applyFormatting(line.slice(2))}</li>`);
      }
      // Empty line or end of section
      else if (line.trim() === '') {
        if (inList) { html.push('</ul>'); inList = false; }
        if (inTable && tableRows.length > 0) {
          html.push(renderTable(tableRows));
          inTable = false;
          tableRows = [];
        }
      }
      // Regular paragraph
      else if (line.trim()) {
        if (inList) { html.push('</ul>'); inList = false; }
        html.push(`<p class="text-slate-600 my-3 leading-relaxed">${applyFormatting(line)}</p>`);
      }
    });

    if (inList) html.push('</ul>');
    if (inTable && tableRows.length > 0) html.push(renderTable(tableRows));

    return html.join('\n');
  };

  const renderTable = (rows: string[]) => {
    if (rows.length < 2) return '';

    const headerCells = rows[0].split('|').filter(c => c.trim());
    const dataRows = rows.slice(2); // Skip header and separator

    let tableHtml = '<table class="w-full my-4 border-collapse">';
    tableHtml += '<thead><tr class="bg-slate-100">';
    headerCells.forEach(cell => {
      tableHtml += `<th class="border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700">${escapeHtml(cell.trim())}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    dataRows.forEach(row => {
      const cells = row.split('|').filter(c => c.trim());
      tableHtml += '<tr>';
      cells.forEach(cell => {
        tableHtml += `<td class="border border-slate-200 px-4 py-2 text-sm text-slate-600">${escapeHtml(cell.trim())}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    return tableHtml;
  };

  return (
    <div className={cn('bg-white', className)}>
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <FileText size={28} className="text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">{document.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Effective: {formatDate(document.effective_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Tag size={14} />
              <span>Version: {document.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Last Updated: {formatDate(document.last_updated)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        <div
          className="max-w-4xl mx-auto prose prose-slate"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(document.content) }}
        />
      </div>
    </div>
  );
}
