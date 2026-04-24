import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../api/client';

const schema = z.object({
  aquiferStressPct: z.coerce.number().min(0).max(100),
  waterLabel:       z.string().min(1),
  uvPeak:           z.coerce.number().min(1).max(11),
  uvLabel:          z.string().min(1),
  descriptionEn:    z.string().optional(),
  descriptionFr:    z.string().optional(),
  descriptionAr:    z.string().optional(),
  centroidLat:      z.coerce.number().optional(),
  centroidLng:      z.coerce.number().optional(),
});

type FormValues = z.infer<typeof schema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-cream/60 text-xs mb-1">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-canvas border border-white/20 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold/60"
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full bg-canvas border border-white/20 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold/60 resize-none"
    />
  );
}

export default function GovernorateEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: gov, isLoading } = useQuery({
    queryKey: ['admin-governorate', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/governorates/${id}`);
      return data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (gov) reset(gov);
  }, [gov, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => apiClient.patch(`/admin/governorates/${id}`, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-governorates'] });
      navigate('/governorates');
    },
  });

  if (isLoading) return <div className="p-8 text-cream/40">Loading…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-cream text-2xl font-semibold mb-2">{gov?.shapeName}</h1>
      <p className="text-cream/40 text-sm mb-6 font-mono">{gov?.shapeISO}</p>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        <section className="bg-surface rounded-lg border border-white/10 p-5 space-y-4">
          <h2 className="text-cream/60 text-xs uppercase tracking-wider font-medium">Water & UV</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Aquifer Stress (%)" error={errors.aquiferStressPct?.message}>
              <Input type="number" min="0" max="100" {...register('aquiferStressPct')} />
            </Field>
            <Field label="Water Label" error={errors.waterLabel?.message}>
              <Input {...register('waterLabel')} placeholder="Low stress" />
            </Field>
            <Field label="UV Peak (1–11)" error={errors.uvPeak?.message}>
              <Input type="number" min="1" max="11" {...register('uvPeak')} />
            </Field>
            <Field label="UV Label" error={errors.uvLabel?.message}>
              <Input {...register('uvLabel')} placeholder="Moderate UV" />
            </Field>
          </div>
        </section>

        <section className="bg-surface rounded-lg border border-white/10 p-5 space-y-4">
          <h2 className="text-cream/60 text-xs uppercase tracking-wider font-medium">Centroid</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude" error={errors.centroidLat?.message}>
              <Input type="number" step="0.0001" {...register('centroidLat')} />
            </Field>
            <Field label="Longitude" error={errors.centroidLng?.message}>
              <Input type="number" step="0.0001" {...register('centroidLng')} />
            </Field>
          </div>
        </section>

        <section className="bg-surface rounded-lg border border-white/10 p-5 space-y-4">
          <h2 className="text-cream/60 text-xs uppercase tracking-wider font-medium">Description</h2>
          <Field label="English">
            <Textarea {...register('descriptionEn')} />
          </Field>
          <Field label="French">
            <Textarea {...register('descriptionFr')} />
          </Field>
          <Field label="Arabic">
            <Textarea {...register('descriptionAr')} dir="rtl" />
          </Field>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gold/90 hover:bg-gold text-ink font-semibold px-6 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/governorates')}
            className="text-cream/50 hover:text-cream text-sm transition-colors px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
