import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface QueueCounts {
  waiting:   number;
  active:    number;
  completed: number;
  failed:    number;
  delayed:   number;
  error?:    string;
}

interface HealthData {
  ts:     string;
  redis:  'ok' | 'error';
  db:     'ok' | 'error';
  queues: Record<string, QueueCounts>;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
      aria-hidden
    />
  );
}

function ServiceCard({ label, status }: { label: string; status: 'ok' | 'error' }) {
  const ok = status === 'ok';
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
      <StatusDot ok={ok} />
      <div>
        <p className="text-cream text-sm font-medium">{label}</p>
        <p className={`text-xs font-mono ${ok ? 'text-green-400' : 'text-red-400'}`}>{status}</p>
      </div>
    </div>
  );
}

function QueueCard({ name, counts }: { name: string; counts: QueueCounts }) {
  if (counts.error) {
    return (
      <div className="bg-surface border border-red-800/40 rounded-xl p-4">
        <p className="text-cream text-sm font-medium mb-1">{name}</p>
        <p className="text-red-400 text-xs font-mono">{counts.error}</p>
      </div>
    );
  }

  const stats: { label: string; value: number; color: string }[] = [
    { label: 'waiting',   value: counts.waiting,   color: 'text-muted' },
    { label: 'active',    value: counts.active,     color: 'text-blue-400' },
    { label: 'completed', value: counts.completed,  color: 'text-green-400' },
    { label: 'failed',    value: counts.failed,     color: counts.failed > 0 ? 'text-red-400' : 'text-muted' },
    { label: 'delayed',   value: counts.delayed,    color: 'text-yellow-400' },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-cream text-sm font-semibold mb-3">{name}</p>
      <div className="grid grid-cols-5 gap-2">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className={`font-mono text-lg font-semibold ${color}`}>{value}</p>
            <p className="text-2xs text-muted uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SystemHealth() {
  const { data, isLoading, error, dataUpdatedAt } = useQuery<HealthData>({
    queryKey: ['admin-health'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/health');
      return data;
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-cream text-2xl font-semibold">System Health</h1>
          <p className="text-muted text-sm mt-0.5">
            {dataUpdatedAt
              ? `Last refreshed ${new Date(dataUpdatedAt).toLocaleTimeString()} · auto-updates every 30s`
              : 'Loading…'}
          </p>
        </div>
      </div>

      {isLoading && <p className="text-muted">Loading health data…</p>}

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4 text-red-400 text-sm">
          Failed to fetch health data. Make sure the API is running and you are logged in.
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* Services */}
          <section>
            <h2 className="text-muted text-xs uppercase tracking-wider font-medium mb-3">Services</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ServiceCard label="Database"  status={data.db} />
              <ServiceCard label="Redis"     status={data.redis} />
            </div>
          </section>

          {/* Queues */}
          <section>
            <h2 className="text-muted text-xs uppercase tracking-wider font-medium mb-3">BullMQ Queues</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(data.queues).map(([name, counts]) => (
                <QueueCard key={name} name={name} counts={counts as QueueCounts} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
