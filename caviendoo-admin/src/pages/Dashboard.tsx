import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Metrics {
  totalFruits: number;
  totalGovernorates: number;
  totalAOC: number;
}

function StatCard({ label, value, to }: { label: string; value: number; to?: string }) {
  const content = (
    <div className="bg-surface border border-white/10 rounded-lg p-5">
      <p className="text-cream/50 text-sm">{label}</p>
      <p className="font-mono text-3xl text-cream mt-1">{value}</p>
    </div>
  );
  if (to) return <Link to={to} className="hover:border-gold/40 transition-colors block rounded-lg">{content}</Link>;
  return content;
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/metrics');
      return data;
    },
  });

  return (
    <div className="p-8">
      <h1 className="font-display text-cream text-2xl font-semibold mb-6">Dashboard</h1>

      {isLoading ? (
        <p className="text-cream/40">Loading…</p>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          <StatCard label="Fruits"       value={data?.totalFruits ?? 0}       to="/fruits" />
          <StatCard label="Governorates" value={data?.totalGovernorates ?? 0} to="/governorates" />
          <StatCard label="AOC Labels"   value={data?.totalAOC ?? 0} />
        </div>
      )}

      <div className="mt-10 flex gap-3">
        <Link
          to="/fruits/new"
          className="bg-gold/90 hover:bg-gold text-ink text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          + Add Fruit
        </Link>
      </div>
    </div>
  );
}
