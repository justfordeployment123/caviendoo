import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
  images:             { cdnUrlThumb: string | null; isPrimary: boolean }[];
}

interface FruitsResponse {
  data: FruitSummary[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const CATEGORIES = ['', 'citrus', 'stone', 'pomme', 'tropical', 'berry', 'dried', 'melon', 'other'];

export default function FruitList() {
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('');
  const [isAOC,     setIsAOC]     = useState(false);
  const [isHeritage, setIsHeritage] = useState(false);
  const qc = useQueryClient();

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-cream text-2xl font-semibold">Fruits</h1>
          <p className="text-muted text-sm mt-0.5">{data?.meta.total ?? 0} total</p>
        </div>
        <Link
          to="/fruits/new"
          className="bg-gold hover:bg-gold/80 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Add Fruit
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search EN / FR / AR / Latin…"
          className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 w-64"
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
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Fruit</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Governorate</th>
                  <th className="px-4 py-3 text-left">Badges</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">
                      No fruits found{hasActiveFilters ? ' — try adjusting your filters' : ''}.
                    </td>
                  </tr>
                )}
                {data?.data.map((fruit) => {
                  const thumb = fruit.images.find((i) => i.isPrimary)?.cdnUrlThumb ?? fruit.images[0]?.cdnUrlThumb;
                  return (
                    <tr key={fruit.id} className="hover:bg-ink/5 transition-colors">
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
                            <p className="text-muted text-xs" dir="rtl">{fruit.nameAr}</p>
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
