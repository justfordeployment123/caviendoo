import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface AuditEntry {
  id:          number;
  action:      'CREATE' | 'UPDATE' | 'DELETE';
  entityType:  string;
  entityId:    string;
  entityName:  string;
  adminEmail:  string;
  createdAt:   string;
}

interface AuditResponse {
  data: AuditEntry[];
  meta: { total: number; page: number; limit: number; pages: number };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-900/30 text-green-400',
  UPDATE: 'bg-blue-900/30 text-blue-400',
  DELETE: 'bg-red-900/30 text-red-400',
};

export default function ActivityLog() {
  const [page, setPage]             = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction]         = useState('');

  const { data, isLoading } = useQuery<AuditResponse>({
    queryKey: ['admin-audit-logs', page, entityType, action],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (entityType) params.set('entityType', entityType);
      if (action)     params.set('action', action);
      const { data } = await apiClient.get(`/admin/audit-logs?${params}`);
      return data;
    },
  });

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="font-display text-cream text-2xl font-semibold">Activity Log</h1>
        <p className="text-muted text-sm mt-0.5">{data?.meta.total ?? 0} total entries</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
        >
          <option value="">All types</option>
          <option value="fruit">Fruits</option>
          <option value="governorate">Governorates</option>
        </select>

        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
        >
          <option value="">All actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-border">
              {data?.data.length === 0 && (
                <p className="px-4 py-8 text-center text-muted text-sm">No audit entries yet.</p>
              )}
              {data?.data.map((entry) => (
                <div key={entry.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${ACTION_COLORS[entry.action] ?? 'text-muted'}`}>
                      {entry.action}
                    </span>
                    <span className="text-muted text-xs font-mono whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-cream text-sm font-medium">{entry.entityName}</p>
                  <p className="text-muted text-xs capitalize">{entry.entityType} · {entry.adminEmail}</p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="border-b border-border">
                  <tr className="text-muted text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Entity</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Admin</th>
                    <th className="px-4 py-3 text-left">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.data.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted text-sm">
                        No audit entries yet.
                      </td>
                    </tr>
                  )}
                  {data?.data.map((entry) => (
                    <tr key={entry.id} className="hover:bg-ink/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${ACTION_COLORS[entry.action] ?? 'text-muted'}`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted capitalize font-mono text-xs">{entry.entityType}</td>
                      <td className="px-4 py-3 text-cream">{entry.entityName}</td>
                      <td className="px-4 py-3 text-muted text-xs">{entry.adminEmail}</td>
                      <td className="px-4 py-3 text-muted text-xs font-mono whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Pagination */}
          {data && data.meta.pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted">
              <span>{data.meta.total} entries</span>
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
