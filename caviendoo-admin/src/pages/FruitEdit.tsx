import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../api/client';
import ImageUploader from '../components/ImageUploader';
import SeasonEditor from '../components/SeasonEditor';

const CATEGORIES = ['citrus', 'stone', 'pomme', 'tropical', 'berry', 'dried', 'melon', 'other'] as const;
const SUSTAINABILITY = ['low', 'moderate', 'high'] as const;

const envSchema = z.object({
  blueWaterLkg:        z.coerce.number().min(0),
  greenWaterLkg:       z.coerce.number().min(0),
  totalWaterLkg:       z.coerce.number().min(0),
  aquiferStressPct:    z.coerce.number().min(0).max(100),
  uvMin:               z.coerce.number().min(1).max(11),
  uvMax:               z.coerce.number().min(1).max(11),
  uvPeak:              z.coerce.number().min(1).max(11),
  uvNote:              z.string(),
  sustainabilityClass: z.enum(SUSTAINABILITY),
});

const nutritionalRowSchema = z.object({
  labelEn: z.string().min(1, 'Required'),
  labelFr: z.string().min(1, 'Required'),
  labelAr: z.string().min(1, 'Required'),
  value:   z.string().min(1, 'Required'),
});

const schema = z.object({
  id:                 z.string().regex(/^[a-z0-9-]+$/, 'Use lowercase kebab-case').min(2),
  nameEn:             z.string().min(1),
  nameFr:             z.string().min(1),
  nameAr:             z.string().min(1),
  localName:          z.string(),
  latinName:          z.string().min(1),
  category:           z.enum(CATEGORIES),
  isAOC:              z.boolean(),
  isHeritage:         z.boolean(),
  primaryGovernorate: z.string().min(1),
  descriptionEn:      z.string(),
  descriptionFr:      z.string(),
  descriptionAr:      z.string(),
  culturalNotesEn:    z.string(),
  culturalNotesFr:    z.string(),
  culturalNotesAr:    z.string(),
  zoneEn:             z.string(),
  zoneFr:             z.string(),
  zoneAr:             z.string(),
  localities:         z.string(),
  tags:               z.string(),
  seasonPre:          z.array(z.number()),
  seasonPeak:         z.array(z.number()),
  seasonPost:         z.array(z.number()),
  environmental:      envSchema.optional(),
  nutritional:        z.array(nutritionalRowSchema).default([]),
  governorateNames:   z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: Partial<FormValues> = {
  isAOC:            false,
  isHeritage:       false,
  category:         'other',
  seasonPre:        [],
  seasonPeak:       [],
  seasonPost:       [],
  localities:       '',
  tags:             '',
  nutritional:      [],
  governorateNames: [],
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-cream/60 text-xs mb-1">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-canvas border border-white/20 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold/60 ${className}`}
    />
  );
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full bg-canvas border border-white/20 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold/60 resize-none ${className}`}
    />
  );
}

export default function FruitEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: fruit, isLoading } = useQuery({
    queryKey: ['admin-fruit', id],
    queryFn:  async () => {
      const { data } = await apiClient.get(`/admin/fruits/${id}`);
      return data;
    },
    enabled: !isNew,
  });

  const { data: regions = [] } = useQuery({
    queryKey: ['admin-regions'],
    queryFn:  async () => {
      const { data } = await apiClient.get('/regions', { params: { country: 'TN' } });
      return data.data as { id: number; shapeName: string }[];
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver:      zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const { fields: nutritionalFields, append: appendNutritional, remove: removeNutritional } =
    useFieldArray({ control, name: 'nutritional' });

  const watchedGovNames   = watch('governorateNames');
  const watchedPrimaryGov = watch('primaryGovernorate');

  useEffect(() => {
    if (fruit) {
      reset({
        ...fruit,
        environmental:    (fruit.environmental as any[])?.[0] ?? undefined,
        localities:       (fruit.localities as string[]).join(', '),
        tags:             (fruit.tags as string[]).join(', '),
        nutritional:      (fruit.nutritional ?? []).map((n: any) => ({
          labelEn: n.labelEn,
          labelFr: n.labelFr,
          labelAr: n.labelAr,
          value:   n.value,
        })),
        governorateNames: (fruit.governorates ?? []).map((fg: any) => fg.governorate.shapeName),
      });
    }
  }, [fruit, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        localities: values.localities.split(',').map((s) => s.trim()).filter(Boolean),
        tags:       values.tags.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (isNew) {
        return apiClient.post('/admin/fruits', payload);
      }
      return apiClient.patch(`/admin/fruits/${id}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-fruits'] });
      navigate('/fruits');
    },
  });

  const toggleGovernorate = (name: string, checked: boolean) => {
    const current = watchedGovNames ?? [];
    if (checked) {
      setValue('governorateNames', [...current, name], { shouldValidate: true });
    } else {
      const next = current.filter((n) => n !== name);
      setValue('governorateNames', next, { shouldValidate: true });
      if (watchedPrimaryGov === name) {
        setValue('primaryGovernorate', next[0] ?? '');
      }
    }
  };

  if (!isNew && isLoading) return <div className="p-8 text-cream/40">Loading…</div>;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display text-cream text-2xl font-semibold mb-6">
        {isNew ? 'Add Fruit' : 'Edit Fruit'}
      </h1>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-8">

        {/* Identity */}
        <section className="bg-surface rounded-lg border border-white/10 p-5 space-y-4">
          <h2 className="text-cream/60 text-xs uppercase tracking-wider font-medium mb-3">Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug (ID)" error={errors.id?.message}>
              <Input {...register('id')} placeholder="deglet-noor-date" readOnly={!isNew} />
            </Field>
            <Field label="Latin Name" error={errors.latinName?.message}>
              <Input {...register('latinName')} placeholder="Phoenix dactylifera" />
            </Field>
            <Field label="Name (EN)" error={errors.nameEn?.message}>
              <Input {...register('nameEn')} />
            </Field>
            <Field label="Name (FR)" error={errors.nameFr?.message}>
              <Input {...register('nameFr')} />
            </Field>
            <Field label="Name (AR)" error={errors.nameAr?.message}>
              <Input {...register('nameAr')} />
            </Field>
            <Field label="Local Name (dialect)" error={errors.localName?.message}>
              <Input {...register('localName')} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Category" error={errors.category?.message}>
              <select
                {...register('category')}
                className="w-full bg-canvas border border-white/20 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold/60"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Primary Governorate" error={errors.primaryGovernorate?.message}>
              <select
                {...register('primaryGovernorate')}
                className="w-full bg-canvas border border-white/20 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold/60"
              >
                <option value="">Select primary…</option>
                {(watchedGovNames ?? []).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </Field>
            <Field label="Flags">
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-cream/70 text-sm cursor-pointer">
                  <input type="checkbox" {...register('isAOC')} className="accent-gold" />
                  AOC
                </label>
                <label className="flex items-center gap-2 text-cream/70 text-sm cursor-pointer">
                  <input type="checkbox" {...register('isHeritage')} className="accent-gold" />
                  Heritage
                </label>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Localities (comma-separated)" error={errors.localities?.message}>
              <Input {...register('localities')} placeholder="Tozeur, Nefta" />
            </Field>
            <Field label="Tags (comma-separated)" error={errors.tags?.message}>
              <Input {...register('tags')} placeholder="export, GI" />
            </Field>
          </div>
        </section>

        {/* Growing Regions */}
        <section className="bg-surface rounded-lg border border-white/10 p-5">
          <h2 className="text-cream/60 text-xs uppercase tracking-wider font-medium mb-4">Growing Regions</h2>
          <div className="grid grid-cols-4 gap-2">
            {regions.map((region) => (
              <label key={region.id} className="flex items-center gap-2 text-cream/70 text-sm cursor-pointer py-1">
                <input
                  type="checkbox"
                  className="accent-gold"
                  checked={(watchedGovNames ?? []).includes(region.shapeName)}
                  onChange={(e) => toggleGovernorate(region.shapeName, e.target.checked)}
                />
                {region.shapeName}
              </label>
            ))}
          </div>
        </section>

        {/* Localised text */}
        <section className="bg-surface rounded-lg border border-white/10 p-5 space-y-4">
          <h2 className="text-cream/60 text-xs uppercase tracking-wider font-medium mb-3">Description</h2>
          {(['En', 'Fr', 'Ar'] as const).map((lang) => (
            <div key={lang} className="grid grid-cols-2 gap-4">
              <Field label={`Description (${lang})`}>
                <Textarea {...register(`description${lang}`)} />
              </Field>
              <Field label={`Cultural Notes (${lang})`}>
                <Textarea {...register(`culturalNotes${lang}`)} />
              </Field>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-4">
            {(['En', 'Fr', 'Ar'] as const).map((lang) => (
              <Field key={lang} label={`Zone (${lang})`}>
                <Input {...register(`zone${lang}`)} />
              </Field>
            ))}
          </div>
        </section>

        {/* Season */}
        <section className="bg-surface rounded-lg border border-white/10 p-5">
          <h2 className="text-cream/60 text-xs uppercase tracking-wider font-medium mb-4">Season Calendar</h2>
          <div className="space-y-3">
            {(['Pre', 'Peak', 'Post'] as const).map((phase) => (
              <div key={phase} className="flex items-center gap-4">
                <span className="text-cream/50 text-sm w-10">{phase}</span>
                <Controller
                  name={`season${phase}` as 'seasonPre' | 'seasonPeak' | 'seasonPost'}
                  control={control}
                  render={({ field }) => (
                    <SeasonEditor value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Environmental */}
        <section className="bg-surface rounded-lg border border-white/10 p-5 space-y-4">
          <h2 className="text-cream/60 text-xs uppercase tracking-wider font-medium mb-3">Environmental Data</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Blue Water (L/kg)" error={errors.environmental?.blueWaterLkg?.message}>
              <Input type="number" step="0.1" {...register('environmental.blueWaterLkg')} />
            </Field>
            <Field label="Green Water (L/kg)" error={errors.environmental?.greenWaterLkg?.message}>
              <Input type="number" step="0.1" {...register('environmental.greenWaterLkg')} />
            </Field>
            <Field label="Total Water (L/kg)" error={errors.environmental?.totalWaterLkg?.message}>
              <Input type="number" step="0.1" {...register('environmental.totalWaterLkg')} />
            </Field>
            <Field label="Aquifer Stress (%)" error={errors.environmental?.aquiferStressPct?.message}>
              <Input type="number" min="0" max="100" {...register('environmental.aquiferStressPct')} />
            </Field>
            <Field label="UV Min" error={errors.environmental?.uvMin?.message}>
              <Input type="number" min="1" max="11" {...register('environmental.uvMin')} />
            </Field>
            <Field label="UV Max" error={errors.environmental?.uvMax?.message}>
              <Input type="number" min="1" max="11" {...register('environmental.uvMax')} />
            </Field>
            <Field label="UV Peak" error={errors.environmental?.uvPeak?.message}>
              <Input type="number" min="1" max="11" {...register('environmental.uvPeak')} />
            </Field>
            <Field label="Sustainability Class" error={errors.environmental?.sustainabilityClass?.message}>
              <select
                {...register('environmental.sustainabilityClass')}
                className="w-full bg-canvas border border-white/20 rounded px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold/60"
              >
                {SUSTAINABILITY.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="UV Note" error={errors.environmental?.uvNote?.message}>
              <Input {...register('environmental.uvNote')} />
            </Field>
          </div>
        </section>

        {/* Nutritional */}
        <section className="bg-surface rounded-lg border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-cream/60 text-xs uppercase tracking-wider font-medium">Nutritional Data</h2>
            <button
              type="button"
              onClick={() => appendNutritional({ labelEn: '', labelFr: '', labelAr: '', value: '' })}
              className="text-gold text-xs hover:text-gold/70 transition-colors px-2 py-1 border border-gold/30 rounded"
            >
              + Add Row
            </button>
          </div>

          {nutritionalFields.length === 0 ? (
            <p className="text-cream/30 text-sm">No nutritional data. Click "+ Add Row" to add entries.</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 mb-1">
                {['Label EN', 'Label FR', 'Label AR', 'Value', ''].map((h, i) => (
                  <span key={i} className="text-cream/40 text-xs">{h}</span>
                ))}
              </div>
              {nutritionalFields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-start">
                  <Input
                    {...register(`nutritional.${idx}.labelEn`)}
                    placeholder="Calories"
                  />
                  <Input
                    {...register(`nutritional.${idx}.labelFr`)}
                    placeholder="Calories"
                  />
                  <Input
                    {...register(`nutritional.${idx}.labelAr`)}
                    placeholder="سعرات"
                    dir="rtl"
                  />
                  <Input
                    {...register(`nutritional.${idx}.value`)}
                    placeholder="72 kcal"
                  />
                  <button
                    type="button"
                    onClick={() => removeNutritional(idx)}
                    className="text-red-400/60 hover:text-red-400 text-sm px-2 py-1.5 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Image */}
        {!isNew && id && (
          <section className="bg-surface rounded-lg border border-white/10 p-5">
            <h2 className="text-cream/60 text-xs uppercase tracking-wider font-medium mb-4">Primary Image</h2>
            <ImageUploader
              fruitId={id}
              onSuccess={() => qc.invalidateQueries({ queryKey: ['admin-fruit', id] })}
            />
          </section>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gold/90 hover:bg-gold text-ink font-semibold px-6 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save Fruit'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/fruits')}
            className="text-cream/50 hover:text-cream text-sm transition-colors px-4 py-2"
          >
            Cancel
          </button>
          {mutation.isError && (
            <p className="text-red-400 text-sm">Save failed. Please check the form and try again.</p>
          )}
        </div>
      </form>
    </div>
  );
}
