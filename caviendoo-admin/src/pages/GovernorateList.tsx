import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Gov {
  id: number;
  shapeName: string;
  shapeISO: string;
  aquiferStressPct: number;
  waterLabel: string;
  uvPeak: number;
  uvLabel: string;
  centroidLat: number | null;
  centroidLng: number | null;
}

export default function GovernorateList() {
  const { data, isLoading } = useQuery<{ data: Gov[]; meta: object }>({
    queryKey: ['admin-governorates'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/governorates?limit=30');
      return data;
    },
  });

  return (
    <div className="p-8">
      <h1 className="font-display text-cream text-2xl font-semibold mb-6">Governorates</h1>

      {isLoading ? (
        <p className="text-cream/40">Loading…</p>
      ) : (
        <div className="bg-surface rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-cream/40 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Governorate</th>
                <th className="px-4 py-3 text-left">ISO</th>
                <th className="px-4 py-3 text-left">Aquifer Stress</th>
                <th className="px-4 py-3 text-left">UV Peak</th>
                <th className="px-4 py-3 text-left">Centroid</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.data.map((gov) => (
                <tr key={gov.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-cream font-medium">{gov.shapeName}</td>
                  <td className="px-4 py-3 text-cream/50 font-mono text-xs">{gov.shapeISO}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden"
                      >
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${gov.aquiferStressPct}%` }}
                        />
                      </div>
                      <span className="text-cream/50 text-xs font-mono">{gov.aquiferStressPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-cream/60 font-mono">{gov.uvPeak}</td>
                  <td className="px-4 py-3 text-cream/40 text-xs font-mono">
                    {gov.centroidLat != null
                      ? `${gov.centroidLat.toFixed(3)}, ${gov.centroidLng?.toFixed(3)}`
                      : '—'
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/governorates/${gov.id}`}
                      className="text-cream/50 hover:text-cream text-xs transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
