import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';

interface FruitSummary {
  id:                 string;
  nameEn:             string;
  nameFr:             string;
  nameAr:             string;
  category:           string;
  isAOC:              boolean;
  isHeritage:         boolean;
  primaryGovernorate: string;
  published:          boolean;
  images:             { cdnUrlThumb: string | null; isPrimary: boolean }[];
}

interface FruitsResponse {
  data: FruitSummary[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const CATEGORIES = ['', 'citrus', 'stone', 'pomme', 'tropical', 'berry', 'dried', 'melon', 'other'];

function buildAndDownloadCSV(fruits: FruitSummary[]) {
  const headers = ['ID', 'Name (EN)', 'Name (FR)', 'Name (AR)', 'Category', 'Governorate', 'AOC', 'Heritage', 'Published'];
  const rows = fruits.map((f) => [
    f.id,
    `"${f.nameEn.replace(/"/g, '""')}"`,
    `"${f.nameFr.replace(/"/g, '""')}"`,
    `"${f.nameAr.replace(/"/g, '""')}"`,
    f.category,
    f.primaryGovernorate,
    f.isAOC ? 'Yes' : 'No',
    f.isHeritage ? 'Yes' : 'No',
    f.published ? 'Yes' : 'No',
  ]);
  // ﻿ BOM tells Excel this is UTF-8 so Arabic displays correctly
  const csv = '﻿' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href  = url;
  link.download = `caviendoo-fruits-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function FruitList() {
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('');
  const [isAOC,       setIsAOC]       = useState(false);
  const [isHeritage,  setIsHeritage]  = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const qc = useQueryClient();

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const { data: res } = await apiClient.get('/admin/fruits?limit=1000');
      buildAndDownloadCSV(res.data ?? []);
    } catch {
      alert('Export failed — make sure the API is running.');
    } finally {
      setIsExporting(false);
    }
  };

  // Debounced search: only fire after user stops typing 300ms
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout((handleSearch as any)._timer);
    (handleSearch as any)._timer = setTimeout(() => setDebouncedSearch(value), 300);
  };

  function resetFilters() {
    setSearch(''); setDebouncedSearch('');
    setCategory(''); setIsAOC(false); setIsHeritage(false);
    setPage(1);
  }

  const { data, isLoading } = useQuery<FruitsResponse>({
    queryKey: ['admin-fruits', page, debouncedSearch, category, isAOC, isHeritage],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category)  params.set('category', category);
      if (isAOC)     params.set('isAOC', 'true');
      if (isHeritage) params.set('isHeritage', 'true');
      const { data } = await apiClient.get(`/admin/fruits?${params}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/fruits/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-fruits'] }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      apiClient.patch(`/admin/fruits/${id}`, { published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-fruits'] }),
  });

  const refreshImageMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/images/refresh/${id}`),
    onSuccess: (_data, id) => {
      setTimeout(() => qc.invalidateQueries({ queryKey: ['admin-fruits'] }), 3000);
      alert(`Image refresh queued for ${id}`);
    },
  });

  function confirmDelete(id: string, name: string) {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  }

  const hasActiveFilters = debouncedSearch || category || isAOC || isHeritage;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-cream text-2xl font-semibold">Fruits</h1>
          <p className="text-muted text-sm mt-0.5">{data?.meta.total ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-1.5 text-muted hover:text-cream border border-border hover:border-gold/50 text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
            title="Export all fruits as CSV"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'Export CSV'}</span>
          </button>
          <Link
            to="/fruits/new"
            className="bg-gold hover:bg-gold/80 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Add Fruit
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search EN / FR / AR / Latin…"
          className="bg-canvas border border-border rounded-lg px-3 py-2 text-cream text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 w-full sm:w-64"
        />

        {/* Category */}
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c || 'All categories'}</option>
          ))}
        </select>

        {/* AOC toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted hover:text-cream transition-colors select-none">
          <input
            type="checkbox"
            checked={isAOC}
            onChange={(e) => { setIsAOC(e.target.checked); setPage(1); }}
            className="accent-gold"
          />
          AOC only
        </label>

        {/* Heritage toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted hover:text-cream transition-colors select-none">
          <input
            type="checkbox"
            checked={isHeritage}
            onChange={(e) => { setIsHeritage(e.target.checked); setPage(1); }}
            className="accent-gold"
          />
          Heritage only
        </label>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-muted hover:text-red-600 transition-colors px-2 py-1 border border-border rounded-lg"
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="border-b border-border">
                <tr className="text-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Fruit</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Governorate</th>
                  <th className="px-4 py-3 text-left">Badges</th>
                  <th className="px-4 py-3 text-center">Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted text-sm">
                      No fruits found{hasActiveFilters ? ' — try adjusting your filters' : ''}.
                    </td>
                  </tr>
                )}
                {data?.data.map((fruit) => {
                  const thumb = fruit.images.find((i) => i.isPrimary)?.cdnUrlThumb ?? fruit.images[0]?.cdnUrlThumb;
                  return (
                    <tr key={fruit.id} className={`hover:bg-ink/5 transition-colors ${!fruit.published ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-8 h-8 rounded-md object-cover border border-border flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-border flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-cream font-medium">{fruit.nameEn}</p>
                            <p className="text-muted text-xs">{fruit.nameFr}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted capitalize">{fruit.category}</td>
                      <td className="px-4 py-3 text-muted">{fruit.primaryGovernorate}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {fruit.isAOC     && <span className="bg-gold/15 text-gold text-xs px-1.5 py-0.5 rounded font-medium">AOC</span>}
                          {fruit.isHeritage && <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded font-medium">Heritage</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => publishMutation.mutate({ id: fruit.id, published: !fruit.published })}
                          disabled={publishMutation.isPending}
                          title={fruit.published ? 'Click to unpublish' : 'Click to publish'}
                          className={`relative inline-flex items-center w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 ${
                            fruit.published ? 'bg-green-500' : 'bg-zinc-600'
                          }`}
                        >
                          <span
                            className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                              fruit.published ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/fruits/${fruit.id}`}
                            className="text-muted hover:text-cream text-xs transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => refreshImageMutation.mutate(fruit.id)}
                            disabled={refreshImageMutation.isPending}
                            className="text-gold/70 hover:text-gold text-xs transition-colors disabled:opacity-30"
                            title="Re-fetch best image from Pixabay / Unsplash / Pexels / Wikimedia"
                          >
                            ↺ Image
                          </button>
                          <button
                            onClick={() => confirmDelete(fruit.id, fruit.nameEn)}
                            className="text-red-500/70 hover:text-red-600 text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {/* Pagination */}
          {data && data.meta.pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted">
              <span>{data.meta.total} fruits total</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-lg border border-border hover:border-gold/50 disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-muted">{page} / {data.meta.pages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(data.meta.pages, p + 1))}
                  disabled={page === data.meta.pages}
                  className="px-3 py-1 rounded-lg border border-border hover:border-gold/50 disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
