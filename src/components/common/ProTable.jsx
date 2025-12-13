import { useMemo, useState, useRef, useEffect } from "react";
import { FiInbox, FiDownload, FiFile, FiFileText } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Badge from "./Badge.jsx";

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
export default function ProTable({ title, kpis = [], rows = [], columns = [], filters, pageSize = 10, searchPlaceholder = "Search...", loading = false }) {
  const [q, setQ] = useState("");
  const [selects, setSelects] = useState(
    Object.fromEntries((filters?.selects || []).map(s => [s.key, ""]))
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState(null); // {key,dir}
  const [page, setPage] = useState(1);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  function resetAll() {
    setQ(""); setSelects(Object.fromEntries((filters?.selects || []).map(s => [s.key, ""])));
    setFrom(""); setTo(""); setSortBy(null); setPage(1);
  }
  function clearDates() { setFrom(""); setTo(""); setPage(1); }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Helper function to extract text from React elements
  const extractText = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'object') {
      // Handle React elements
      if (value.props) {
        if (typeof value.props.children === 'string' || typeof value.props.children === 'number') {
          return value.props.children;
        }
        if (Array.isArray(value.props.children)) {
          return value.props.children.map(child => extractText(child)).join(' ');
        }
        return extractText(value.props.children);
      }
      // Handle arrays
      if (Array.isArray(value)) {
        return value.map(v => extractText(v)).join(' ');
      }
    }
    return String(value);
  };

  // Export to Excel function
  const handleExportToExcel = () => {
    try {
      if (filtered.length === 0) {
        alert('No data to export');
        return;
      }

      // Prepare data for export (all filtered rows, not just current page)
      const exportData = filtered.map((row, index) => {
        const exportRow = {};
        columns.forEach(col => {
          if (col.key === '__index') {
            exportRow[col.label || 'Index'] = index + 1;
          } else {
            let value = row[col.key];
            // Use render function if available, but extract text from it
            if (col.render) {
              const rendered = col.render(value, row, Badge, index);
              value = extractText(rendered);
            }
            exportRow[col.label || col.key] = value ?? '';
          }
        });
        return exportRow;
      });

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const maxWidth = 50;
      const wscols = columns.map(() => ({ wch: maxWidth }));
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      // Generate filename with current date
      const filename = `export-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      setExportDropdownOpen(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Export to PDF function
  const handleExportToPDF = () => {
    try {
      if (filtered.length === 0) {
        alert('No data to export');
        return;
      }

      const doc = new jsPDF();

      // Add title
      if (title) {
        doc.setFontSize(16);
        doc.text(title, 14, 15);
      }

      // Prepare table data
      const tableData = filtered.map((row, index) => {
        return columns.map(col => {
          if (col.key === '__index') {
            return index + 1;
          } else {
            let value = row[col.key];
            if (col.render) {
              const rendered = col.render(value, row, Badge, index);
              value = extractText(rendered);
            }
            return value ?? '';
          }
        });
      });

      // Prepare headers
      const headers = columns.map(col => col.label || col.key);

      // Add table using autoTable function
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: title ? 25 : 15,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [200, 243, 0], textColor: [8, 20, 40], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { top: title ? 25 : 15 }
      });

      // Generate filename with current date
      const filename = `export-${new Date().toISOString().split('T')[0]}.pdf`;

      // Save file
      doc.save(filename);
      setExportDropdownOpen(false);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export data. Please try again.');
    }
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
          {kpis}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 md:p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="flex-1 w-full lg:w-auto">
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border-gray-300 bg-white px-4 py-3 h-[44px] outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Select Filters */}
          <div className="flex flex-wrap gap-3">
            {(filters?.selects || []).map((s, i) => (
              <select key={s.key || i}
                value={selects[s.key]}
                onChange={e => { setSelects(v => ({ ...v, [s.key]: e.target.value })); setPage(1); }}
                className="rounded-lg border-gray-300 bg-white px-4 py-3 h-[44px] min-w-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                <option value="">{s.label}</option>
                {s.options.map((opt, optIdx) => {
                  // Handle both string options and object options {value, label}
                  const optValue = typeof opt === 'string' ? opt : (opt.value || opt);
                  const optLabel = typeof opt === 'string' ? opt : (opt.label || opt.value || opt);
                  const optKey = typeof opt === 'string' ? opt : (opt.value || optIdx);
                  return <option key={optKey} value={optValue}>{optLabel}</option>;
                })}
              </select>
            ))}

            {/* Date Inputs */}
            <div className="flex gap-2">
              <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
                className="rounded-lg border-gray-300 bg-white px-4 py-3 h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
                className="rounded-lg border-gray-300 bg-white px-4 py-3 h-[44px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 h-[44px] hover:bg-gray-50 transition-all font-medium flex items-center gap-2"
                title="Export data"
              >
                <FiDownload className="h-4 w-4" />
                Export
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <button
                    onClick={handleExportToExcel}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors first:rounded-t-lg"
                  >
                    <FiFile className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Export to Excel</span>
                  </button>
                  <button
                    onClick={handleExportToPDF}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors last:rounded-b-lg"
                  >
                    <FiFileText className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-700">Export to PDF</span>
                  </button>
                </div>
              )}
            </div>

            <button onClick={clearDates}
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 h-[44px] hover:bg-gray-50 transition-all font-medium">
              Clear Dates
            </button>
            <button onClick={resetAll}
              className="rounded-lg bg-[#c8f300] hover:bg-[#a3c600] text-[#081428] border border-[#c8f300] px-6 py-3 h-[44px] shadow-sm hover:shadow-md transition-all font-medium">
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-[1]">
              <tr>
                {columns.map(col => (
                  <th key={col.key}
                    onClick={() => {
                      if (col.key === '__index' || col.sortable === false) return;
                      setSortBy(s => s?.key === col.key
                        ? { key: col.key, dir: s.dir === "asc" ? "desc" : "asc" }
                        : { key: col.key, dir: "asc" });
                    }}
                    className={`px-6 py-4 font-semibold text-gray-800 select-none whitespace-nowrap text-center border-r border-gray-200 last:border-r-0 ${col.key === '__index' || col.sortable === false ? '' : 'cursor-pointer hover:bg-gray-200 transition-colors'}`}>
                    {col.headerRender ? col.headerRender(sortBy) : (
                      <>
                        {col.label}{sortBy?.key === col.key ? (sortBy.dir === "asc" ? " ▲" : " ▼") : ""}
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center bg-gray-50">
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                      <span className="text-gray-600 font-medium font-sans">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {slice.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      {columns.map(c => {
                        const content = c.key === '__index'
                          ? (baseIndex + i + 1)
                          : (c.render ? c.render(r[c.key], r, Badge, baseIndex + i) : r[c.key]);
                        return (
                          <td key={c.key} className="px-6 py-4 whitespace-nowrap text-center border-r border-gray-100 last:border-r-0">
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {!slice.length && (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 bg-gray-50">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <FiInbox size={18} />
                          <span>No data found</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
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
            <span className="rounded-lg border border-brand-500 bg-brand-500 text-dark-base px-4 py-2 text-sm font-medium">
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
