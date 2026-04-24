import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface FruitSummary {
  id: string;
  nameEn: string;
  nameFr: string;
  category: string;
  isAOC: boolean;
  isHeritage: boolean;
  primaryGovernorate: string;
  images: { cdnUrlThumb: string | null; isPrimary: boolean }[];
}

interface FruitsResponse {
  data: FruitSummary[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const CATEGORIES = ['', 'citrus', 'stone', 'pomme', 'tropical', 'berry', 'dried', 'melon', 'other'];

export default function FruitList() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<FruitsResponse>({
    queryKey: ['admin-fruits', page, category],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (category) params.set('category', category);
      const { data } = await apiClient.get(`/admin/fruits?${params}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/fruits/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-fruits'] }),
  });

  function confirmDelete(id: string, name: string) {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-cream text-2xl font-semibold">Fruits</h1>
        <Link
          to="/fruits/new"
          className="bg-gold/90 hover:bg-gold text-ink text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          + Add Fruit
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="bg-surface border border-white/20 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold/60"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c || 'All categories'}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-cream/40">Loading…</p>
      ) : (
        <>
          <div className="bg-surface rounded-lg border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-cream/40 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Fruit</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Governorate</th>
                  <th className="px-4 py-3 text-left">Badges</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.data.map((fruit) => {
                  const thumb = fruit.images.find((i) => i.isPrimary)?.cdnUrlThumb ?? fruit.images[0]?.cdnUrlThumb;
                  return (
                    <tr key={fruit.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-white/10" />
                          )}
                          <div>
                            <p className="text-cream font-medium">{fruit.nameEn}</p>
                            <p className="text-cream/40 text-xs">{fruit.nameFr}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-cream/60 capitalize">{fruit.category}</td>
                      <td className="px-4 py-3 text-cream/60">{fruit.primaryGovernorate}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {fruit.isAOC     && <span className="bg-gold/20 text-gold text-xs px-1.5 py-0.5 rounded">AOC</span>}
                          {fruit.isHeritage && <span className="bg-purple-500/20 text-purple-300 text-xs px-1.5 py-0.5 rounded">Heritage</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/fruits/${fruit.id}`}
                            className="text-cream/50 hover:text-cream text-xs transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => confirmDelete(fruit.id, fruit.nameEn)}
                            className="text-red-400/60 hover:text-red-400 text-xs transition-colors"
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
            <div className="flex items-center justify-between mt-4 text-sm text-cream/50">
              <span>{data.meta.total} fruits total</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-white/10 hover:border-white/30 disabled:opacity-30 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-cream/40">
                  {page} / {data.meta.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.meta.pages, p + 1))}
                  disabled={page === data.meta.pages}
                  className="px-3 py-1 rounded border border-white/10 hover:border-white/30 disabled:opacity-30 transition-colors"
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
