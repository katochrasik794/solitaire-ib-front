import React, { useMemo, useState } from "react";
import { FiInbox, FiDownload, FiFileText, FiFile } from 'react-icons/fi';
import Badge from "./Badge.jsx";

// Pre-import jspdf and jspdf-autotable to ensure they're loaded
let jsPDFLib = null;
let autoTableLoaded = false;

// Load libraries on first use
const loadPDFLibs = async () => {
  if (!jsPDFLib) {
    try {
      const jsPDFModule = await import('jspdf');
      // jspdf v3 exports as default
      jsPDFLib = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule;
      
      if (!autoTableLoaded) {
        // jspdf-autotable automatically extends jsPDF when imported
        await import('jspdf-autotable');
        autoTableLoaded = true;
      }
    } catch (error) {
      console.error('Failed to load PDF libraries:', error);
      throw error;
    }
  }
  return jsPDFLib;
};

/**
 * rows: [{...}], columns: [{key,label,render?}]
 * filters: {
 *  searchKeys: ["symbol","source","status","side"],
 *  selects: [
 *    {key:"symbol", label:"All Symbols", options:["BTCUSD","ETHUSD",...]}
 *    {key:"side", label:"All Sides", options:["Buy","Sell"]}
 *    {key:"source", label:"All Sources", options:["MT5","Bridge","FIX"]}
 *    {key:"status", label:"All Statuses", options:["Filled","Rejected","Cancelled"]}
 *  ]
 *  dateKey: "executedAt" (Date ISO)
 * }
 */
export default function ProTable({
  title,
  kpis = [],
  rows = [],
  columns = [],
  filters,
  pageSize = 10,
  searchPlaceholder = "Search...",
  loading = false,
  emptyMessage = "No data found",
  onResetAll,
  onClearDates,
}) {
  const [q, setQ] = useState("");
  const [selects, setSelects] = useState(
    Object.fromEntries((filters?.selects || []).map(s => [s.key, ""]))
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState(null); // {key,dir}
  const [page, setPage] = useState(1);

  function resetAll() {
    setQ("");
    setSelects(Object.fromEntries((filters?.selects || []).map(s => [s.key, ""])));
    setFrom("");
    setTo("");
    setSortBy(null);
    setPage(1);
    // Allow parent pages (like Admin Logs) to reset their own filters too
    if (typeof onResetAll === "function") {
      onResetAll();
    }
  }

  function clearDates() {
    setFrom("");
    setTo("");
    setPage(1);
    // Allow parent pages to clear external date filters
    if (typeof onClearDates === "function") {
      onClearDates();
    }
  }

  const filtered = useMemo(() => {
    let out = [...rows];

    // text search across keys
    if (q) {
      const lower = q.toLowerCase();
      out = out.filter(r => (filters?.searchKeys || Object.keys(r))
        .some(k => String(r[k] ?? "").toLowerCase().includes(lower)));
    }

    // selects
    for (const [k, v] of Object.entries(selects)) {
      if (v) out = out.filter(r => String(r[k]) === v);
    }

    // date range
    if (filters?.dateKey && (from || to)) {
      const fk = Date.parse(from || "1970-01-01");
      const tk = Date.parse(to || "2999-12-31");
      out = out.filter(r => {
        const t = Date.parse(r[filters.dateKey]);
        return t >= fk && t <= tk;
      });
    }

    // sort
    if (sortBy) {
      const { key, dir } = sortBy;
      out.sort((a, b) => {
        const av = a[key], bv = b[key];
        if (typeof av === "number" && typeof bv === "number") return dir === "asc" ? av - bv : bv - av;
        return dir === "asc"
          ? String(av).localeCompare(String(bv), undefined, { numeric: true })
          : String(bv).localeCompare(String(av), undefined, { numeric: true });
      });
    }
    return out;
  }, [rows, q, selects, from, to, sortBy, filters]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const slice = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const baseIndex = (page - 1) * pageSize;

  // Automatically add SR No column if not present
  const hasIndexColumn = columns.some(col => col.key === '__index' || col.key === 'sr_no' || col.key === 'srNo');
  const displayColumns = hasIndexColumn 
    ? columns 
    : [{ key: '__index', label: 'SR No', sortable: false }, ...columns];

  // Export to PDF
  const exportToPDF = async () => {
    try {
      // Load PDF libraries
      const jsPDF = await loadPDFLibs();
      const doc = new jsPDF();
      const tableData = filtered.map((row, idx) => {
        return displayColumns.map(col => {
          if (col.key === '__index') return idx + 1;
          const content = col.render ? col.render(row[col.key], row, Badge, idx) : row[col.key];
          // Extract text from React elements
          if (typeof content === 'object' && content?.props?.children) {
            // Try to extract text recursively
            const extractText = (node) => {
              if (typeof node === 'string' || typeof node === 'number') return String(node);
              if (Array.isArray(node)) return node.map(extractText).join(' ');
              if (node?.props?.children) return extractText(node.props.children);
              return '';
            };
            return extractText(content).replace(/[^\w\s]/gi, '').trim();
          }
          return String(content || '');
        });
      });

      // Add headers (use displayColumns to include SR No)
      const headers = displayColumns.map(col => col.label);
      
      // Use autoTable - it should be available on doc after importing jspdf-autotable
      if (doc.autoTable && typeof doc.autoTable === 'function') {
        doc.autoTable({
          head: [headers],
          body: tableData,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [249, 250, 251], textColor: [0, 0, 0], fontStyle: 'bold' },
          margin: { top: 20 },
          startY: 20
        });
      } else {
        // Fallback: simple text table if autoTable not available
        let yPos = 20;
        doc.setFontSize(10);
        doc.text(headers.join(' | '), 10, yPos);
        yPos += 10;
        
        tableData.forEach((row) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFontSize(8);
          const rowText = row.map(cell => String(cell || '').substring(0, 30)).join(' | ');
          doc.text(rowText, 10, yPos, { maxWidth: 190 });
          yPos += 8;
        });
      }
      
      doc.save(`${title || 'table'}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      console.error('Error details:', err.message, err.stack);
      // Fallback: Create CSV download instead
      const csvContent = [
        displayColumns.map(col => col.label).join(','),
        ...filtered.map((row, idx) => {
          return displayColumns.map(col => {
            if (col.key === '__index') return idx + 1;
            const content = col.render ? col.render(row[col.key], row, Badge, idx) : row[col.key];
            let text = '';
            if (typeof content === 'object' && content?.props?.children) {
              const extractText = (node) => {
                if (typeof node === 'string' || typeof node === 'number') return String(node);
                if (Array.isArray(node)) return node.map(extractText).join(' ');
                if (node?.props?.children) return extractText(node.props.children);
                return '';
              };
              text = extractText(content).replace(/[^\w\s]/gi, '').trim();
            } else {
              text = String(content || '');
            }
            // Escape commas and quotes for CSV
            return `"${text.replace(/"/g, '""')}"`;
          }).join(',');
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'table'}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert('PDF export failed. Downloaded CSV file instead. Check console for details.');
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    import('xlsx').then((XLSX) => {
      const worksheetData = [
        // Headers
        displayColumns.map(col => col.label),
        // Data rows
        ...filtered.map((row, idx) => {
          return displayColumns.map(col => {
            if (col.key === '__index') return idx + 1;
            const content = col.render ? col.render(row[col.key], row, Badge, idx) : row[col.key];
            // Extract text from React elements
            if (typeof content === 'object' && content?.props?.children) {
              return String(content.props.children).replace(/[^\w\s]/gi, '');
            }
            return String(content || '');
          });
        })
      ];

      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `${title || 'table'}-${new Date().toISOString().split('T')[0]}.xlsx`);
    }).catch(err => {
      console.error('Error exporting Excel:', err);
      alert('Excel export failed. Please install xlsx: npm install xlsx');
    });
  };

  return (
    <div className="space-y-4">
      {title && (
        <div className="px-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
      )}
      {/* KPI cards */}
      {!!kpis.length && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <React.Fragment key={idx}>
              {kpi}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Table with merged filters */}
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200">
        {/* Filters - merged with table */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
          <div className="flex flex-col lg:flex-row gap-2 items-center">
            {/* Search Input */}
            <div className="flex-1 w-full lg:w-auto">
              <input
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1); }}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 h-[40px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Select Filters + (optional) Date Filters */}
            <div className="flex flex-wrap gap-2">
              {(filters?.selects || []).map((s, i) => (
                <select
                  key={s.key || i}
                  value={selects[s.key]}
                  onChange={e => { setSelects(v => ({ ...v, [s.key]: e.target.value })); setPage(1); }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 h-[40px] min-w-[120px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">{s.label}</option>
                  {s.options.map((opt, optIdx) => {
                    // Handle both string and object formats
                    if (typeof opt === 'object' && opt !== null) {
                      return (
                        <option key={opt.value || optIdx} value={opt.value}>
                          {opt.label}
                        </option>
                      );
                    }
                    return (
                      <option key={opt || optIdx} value={opt}>
                        {opt}
                      </option>
                    );
                  })}
                </select>
              ))}

              {/* Date Inputs – only when a dateKey is configured for this table */}
              {filters?.dateKey && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={from}
                    onChange={e => { setFrom(e.target.value); setPage(1); }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 h-[40px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <input
                    type="date"
                    value={to}
                    onChange={e => { setTo(e.target.value); setPage(1); }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 h-[40px] text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Clear date range filters (always visible, safely no-op if dateKey not used) */}
              <button
                onClick={clearDates}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 h-[40px] text-sm hover:bg-gray-50 transition-all font-medium whitespace-nowrap"
              >
                Clear Dates
              </button>
              <button onClick={resetAll}
                className="rounded-lg bg-brand-500 hover:bg-brand-600 text-dark-base px-4 py-2 h-[40px] text-sm shadow-md hover:shadow-lg transition-all font-medium whitespace-nowrap">
                Reset All
              </button>
              {/* Download Buttons */}
               <button onClick={exportToPDF}
                 className="rounded-lg border border-gray-300 bg-white px-3 py-2 h-[40px] text-sm hover:bg-gray-50 transition-all font-medium flex items-center gap-2 whitespace-nowrap">
                 <FiFileText className="w-4 h-4" />
                 PDF
               </button>
               <button onClick={exportToExcel}
                 className="rounded-lg border border-gray-300 bg-white px-3 py-2 h-[40px] text-sm hover:bg-gray-50 transition-all font-medium flex items-center gap-2 whitespace-nowrap">
                 <FiFile className="w-4 h-4" />
                 Excel
               </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes wave {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.7;
            }
            30% {
              transform: translateY(-10px);
              opacity: 1;
            }
          }
          .wave-dot {
            animation: wave 1.4s ease-in-out infinite;
          }
          .wave-dot:nth-child(1) {
            animation-delay: 0ms;
          }
          .wave-dot:nth-child(2) {
            animation-delay: 200ms;
          }
          .wave-dot:nth-child(3) {
            animation-delay: 400ms;
          }
          .protable-scroll-wrapper {
            width: 100%;
            position: relative;
          }
          .protable-scroll-container {
            width: 100%;
            overflow-x: auto !important;
            overflow-y: visible !important;
            scrollbar-width: thin !important;
            scrollbar-color: #94a3b8 #f1f5f9 !important;
            -ms-overflow-style: scrollbar !important;
            display: block !important;
            -webkit-overflow-scrolling: touch;
          }
          .protable-scroll-container::-webkit-scrollbar {
            height: 14px !important;
            display: block !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }
          .protable-scroll-container::-webkit-scrollbar-track {
            background: #f1f5f9 !important;
            border-radius: 0;
            border-top: 1px solid #e2e8f0;
            display: block !important;
          }
          .protable-scroll-container::-webkit-scrollbar-thumb {
            background: #94a3b8 !important;
            border-radius: 7px;
            border: 2px solid #f1f5f9;
            min-width: 20px;
            display: block !important;
          }
          .protable-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #64748b !important;
          }
          .protable-scroll-container table {
            width: auto !important;
            min-width: 100%;
            table-layout: auto;
          }
          .protable-scroll-container th,
          .protable-scroll-container td {
            padding: 0.75rem 1rem !important;
            white-space: nowrap !important;
          }
          .protable-scroll-container th {
            white-space: nowrap !important;
          }
          .protable-scroll-container td {
            white-space: nowrap !important;
          }
          @media (max-width: 768px) {
            .protable-scroll-container th,
            .protable-scroll-container td {
              font-size: 0.75rem;
              padding: 0.5rem 0.75rem !important;
            }
          }
        `}</style>
        <div className="protable-scroll-wrapper">
          <div className="protable-scroll-container">
            <table className="text-sm" style={{ tableLayout: 'auto', width: 'auto', minWidth: '100%' }}>
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-[1]">
                <tr>
                  {displayColumns.map(col => (
                    <th key={col.key}
                      onClick={() => {
                        if (col.key === '__index' || col.sortable === false) return;
                        setSortBy(s => s?.key === col.key
                          ? { key: col.key, dir: s.dir === "asc" ? "desc" : "asc" }
                          : { key: col.key, dir: "asc" });
                      }}
                      className={`px-3 py-2 text-xs font-semibold text-gray-800 select-none whitespace-nowrap text-center border-r border-gray-200 last:border-r-0 ${col.key === '__index' || col.sortable === false ? '' : 'cursor-pointer hover:bg-gray-200 transition-colors'}`}>
                      {col.label}{sortBy?.key === col.key ? (sortBy.dir === "asc" ? " ▲" : " ▼") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={displayColumns.length} className="px-6 py-12 text-center bg-gray-50">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex gap-1.5 items-end">
                          <div className="w-2.5 h-2.5 bg-gray-500 rounded-full wave-dot"></div>
                          <div className="w-2.5 h-2.5 bg-gray-500 rounded-full wave-dot"></div>
                          <div className="w-2.5 h-2.5 bg-gray-500 rounded-full wave-dot"></div>
                        </div>
                        <span className="text-gray-500 ml-2">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {slice.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        {displayColumns.map(c => {
                          const content = c.key === '__index'
                            ? (baseIndex + i + 1)
                            : (c.render ? c.render(r[c.key], r, Badge, baseIndex + i) : r[c.key]);
                          return (
                            <td key={c.key} className="px-3 py-2 text-xs whitespace-nowrap text-center border-r border-gray-100 last:border-r-0">
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {!slice.length && (
                      <tr>
                        <td colSpan={displayColumns.length} className="px-6 py-12 text-center text-gray-500 bg-gray-50">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <FiInbox className="w-5 h-5" />
                            <span>{emptyMessage}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          <div className="text-sm text-gray-700 font-medium">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              « First
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              ‹ Prev
            </button>
            <span className="rounded-lg border border-gray-300 bg-brand-500 text-dark-base px-4 py-2 text-sm font-medium">
              {page}
            </span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              Next ›
            </button>
            <button onClick={() => setPage(pages)} disabled={page === pages}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              Last »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

