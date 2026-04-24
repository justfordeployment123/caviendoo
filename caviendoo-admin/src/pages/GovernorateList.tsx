import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { stressColor, uvColor, uvLabel, stressLabel } from '../utils/colors';

interface Gov {
  id:               number;
  shapeName:        string;
  shapeISO:         string;
  aquiferStressPct: number;
  waterLabel:       string;
  uvPeak:           number;
  uvLabel:          string;
  fruitCount:       number;
  centroidLat:      number | null;
  centroidLng:      number | null;
}

export default function GovernorateList() {
  const { data, isLoading } = useQuery<{ data: Gov[] }>({
    queryKey: ['admin-governorates'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/governorates?limit=30');
      return data;
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-cream text-2xl font-semibold">Governorates</h1>
          <p className="text-muted text-sm mt-0.5">{data?.data.length ?? 0} total</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-muted text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Governorate</th>
                <th className="px-4 py-3 text-left">Water Stress</th>
                <th className="px-4 py-3 text-left">UV Peak</th>
                <th className="px-4 py-3 text-left">Fruits</th>
                <th className="px-4 py-3 text-left">Centroid</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.map((gov) => {
                const sc = stressColor(gov.aquiferStressPct);
                const uc = uvColor(gov.uvPeak);
                return (
                  <tr key={gov.id} className="hover:bg-ink/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-cream font-medium">{gov.shapeName}</p>
                      <p className="text-muted text-xs font-mono">{gov.shapeISO}</p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${gov.aquiferStressPct}%`, backgroundColor: sc }}
                          />
                        </div>
                        <div>
                          <span className="text-xs font-mono font-medium" style={{ color: sc }}>
                            {gov.aquiferStressPct}%
                          </span>
                          <p className="text-muted text-xs leading-none mt-0.5">
                            {gov.waterLabel || stressLabel(gov.aquiferStressPct)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: uc }}
                        />
                        <span className="font-mono font-medium text-cream">{gov.uvPeak}</span>
                        <span className="text-muted text-xs">
                          {gov.uvLabel || uvLabel(gov.uvPeak)}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-cream font-mono">{gov.fruitCount ?? '—'}</span>
                    </td>

                    <td className="px-4 py-3 text-muted text-xs font-mono">
                      {gov.centroidLat != null
                        ? `${gov.centroidLat.toFixed(3)}, ${gov.centroidLng?.toFixed(3)}`
                        : '—'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/governorates/${gov.id}`}
                        className="text-muted hover:text-cream text-xs transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
