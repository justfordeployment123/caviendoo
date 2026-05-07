import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Languages } from 'lucide-react';
import { apiClient } from '../api/client';
import ImageUploader from '../components/ImageUploader';
import SeasonEditor from '../components/SeasonEditor';

const CATEGORIES = ['citrus', 'stone', 'pomme', 'tropical', 'berry', 'dried', 'melon', 'other'] as const;
const SUSTAINABILITY = ['low', 'moderate', 'high'] as const;
const TOLERANCE = ['low', 'medium', 'high'] as const;
const EXPORT_STATUS = ['exported', 'local_only', 'artisanal_only'] as const;
const CONSERVATION_STATUS = ['common', 'watch', 'vulnerable', 'endangered', 'critical'] as const;
const POLLINATOR_DEPENDENCY = ['self_fertile', 'bee_dependent', 'cross_pollination'] as const;

const optionalNum = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.coerce.number().nullable(),
);
const optionalInt = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.coerce.number().int().nullable(),
);
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : v),
    z.enum(values).nullable(),
  );
const optionalBool = z.preprocess(
  (v) => {
    if (v === '' || v === null || v === undefined) return null;
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v;
  },
  z.boolean().nullable(),
);

function csvToArray(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

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

  // ── Agronomy & Intelligence ─────────────────────────────────────────────
  soilPhMin:            optionalNum,
  soilPhMax:            optionalNum,
  salinityTolerance:    optionalEnum(TOLERANCE),
  soilTypes:            z.string().default(''),               // CSV in form, array in payload
  chillHoursMin:        optionalInt,
  rainfallMmMin:        optionalInt,
  rainfallMmMax:        optionalInt,
  droughtTolerance:     optionalEnum(TOLERANCE),
  frostRiskMonths:      z.array(z.number()).default([]),
  productionTonnesYear: optionalNum,
  exportStatus:         optionalEnum(EXPORT_STATUS),
  pricePremiumIndex:    optionalNum,
  conservationStatus:   optionalEnum(CONSERVATION_STATUS),
  knownFarmsCount:      optionalInt,
  seedBankStatus:       optionalBool,
  daysFlowerToHarvest:  optionalInt,
  harvestWindowDays:    optionalInt,
  pollinatorDependency: optionalEnum(POLLINATOR_DEPENDENCY),
  carbonFootprintKgCo2: optionalNum,
  postHarvestLossPct:   optionalNum,
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

  soilPhMin:            null,
  soilPhMax:            null,
  salinityTolerance:    null,
  soilTypes:            '',
  chillHoursMin:        null,
  rainfallMmMin:        null,
  rainfallMmMax:        null,
  droughtTolerance:     null,
  frostRiskMonths:      [],
  productionTonnesYear: null,
  exportStatus:         null,
  pricePremiumIndex:    null,
  conservationStatus:   null,
  knownFarmsCount:      null,
  seedBankStatus:       null,
  daysFlowerToHarvest:  null,
  harvestWindowDays:    null,
  pollinatorDependency: null,
  carbonFootprintKgCo2: null,
  postHarvestLossPct:   null,
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-muted text-xs font-medium mb-1">{label}</label>
      {children}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 ${className}`}
    />
  );
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 resize-none ${className}`}
    />
  );
}

type Lang = 'en' | 'fr' | 'ar';

function LangTabs({ active, onChange }: { active: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex gap-0.5 bg-canvas border border-border rounded-lg p-0.5 w-fit">
      {(['en', 'fr', 'ar'] as Lang[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
            active === lang
              ? 'bg-gold text-white shadow-sm'
              : 'text-muted hover:text-cream'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function FruitEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeLang, setActiveLang] = useState<Lang>('en');
  const [translating, setTranslating] = useState(false);

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
        soilTypes:        (fruit.soilTypes as string[] ?? []).join(', '),
        frostRiskMonths:  fruit.frostRiskMonths ?? [],
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
        localities: csvToArray(values.localities),
        tags:       csvToArray(values.tags),
        soilTypes:  csvToArray(values.soilTypes ?? ''),
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

  const handleAutoTranslate = async () => {
    const watched = {
      nameEn:          watch('nameEn'),
      descriptionEn:   watch('descriptionEn'),
      culturalNotesEn: watch('culturalNotesEn'),
      zoneEn:          watch('zoneEn'),
    };
    const texts = [watched.nameEn, watched.descriptionEn, watched.culturalNotesEn, watched.zoneEn].map((t) => t ?? '');
    setTranslating(true);
    try {
      const { data } = await apiClient.post('/admin/translate', { texts });
      const [name, desc, notes, zone] = data.results as { fr: string; ar: string }[];
      if (name)  { setValue('nameFr',  name.fr);  setValue('nameAr',  name.ar); }
      if (desc)  { setValue('descriptionFr',  desc.fr);  setValue('descriptionAr',  desc.ar); }
      if (notes) { setValue('culturalNotesFr', notes.fr); setValue('culturalNotesAr', notes.ar); }
      if (zone)  { setValue('zoneFr',  zone.fr);  setValue('zoneAr',  zone.ar); }
    } catch {
      alert('Translation failed — check that the API is running and ANTHROPIC_API_KEY is set.');
    } finally {
      setTranslating(false);
    }
  };

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

  if (!isNew && isLoading) return <div className="p-8 text-muted">Loading…</div>;

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-cream text-2xl font-semibold">
          {isNew ? 'Add Fruit' : 'Edit Fruit'}
        </h1>
        <button
          type="button"
          onClick={handleAutoTranslate}
          disabled={translating}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface border border-border rounded-lg text-muted hover:text-cream hover:border-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {translating ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Languages size={14} />
          )}
          {translating ? 'Translating…' : 'Auto-translate from EN'}
        </button>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-8">

        {/* Identity */}
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-muted text-xs uppercase tracking-wider font-medium mb-3">Identity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Category" error={errors.category?.message}>
              <select
                {...register('category')}
                className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Primary Governorate" error={errors.primaryGovernorate?.message}>
              <select
                {...register('primaryGovernorate')}
                className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
              >
                <option value="">Select primary…</option>
                {(watchedGovNames ?? []).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </Field>
            <Field label="Flags">
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-muted text-sm cursor-pointer">
                  <input type="checkbox" {...register('isAOC')} className="accent-gold" />
                  AOC
                </label>
                <label className="flex items-center gap-2 text-muted text-sm cursor-pointer">
                  <input type="checkbox" {...register('isHeritage')} className="accent-gold" />
                  Heritage
                </label>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Localities (comma-separated)" error={errors.localities?.message}>
              <Input {...register('localities')} placeholder="Tozeur, Nefta" />
            </Field>
            <Field label="Tags (comma-separated)" error={errors.tags?.message}>
              <Input {...register('tags')} placeholder="export, GI" />
            </Field>
          </div>
        </section>

        {/* Growing Regions */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-muted text-xs uppercase tracking-wider font-medium mb-4">Growing Regions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {regions.map((region) => (
              <label key={region.id} className="flex items-center gap-2 text-muted text-sm cursor-pointer py-1">
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
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-muted text-xs uppercase tracking-wider font-medium">Description &amp; Cultural Notes</h2>
            <LangTabs active={activeLang} onChange={setActiveLang} />
          </div>

          {activeLang === 'en' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Description (EN)">
                <Textarea {...register('descriptionEn')} />
              </Field>
              <Field label="Cultural Notes (EN)">
                <Textarea {...register('culturalNotesEn')} />
              </Field>
            </div>
          )}
          {activeLang === 'fr' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Description (FR)">
                <Textarea {...register('descriptionFr')} />
              </Field>
              <Field label="Cultural Notes (FR)">
                <Textarea {...register('culturalNotesFr')} />
              </Field>
            </div>
          )}
          {activeLang === 'ar' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="rtl">
              <Field label="الوصف (AR)">
                <Textarea {...register('descriptionAr')} dir="rtl" />
              </Field>
              <Field label="الملاحظات الثقافية (AR)">
                <Textarea {...register('culturalNotesAr')} dir="rtl" />
              </Field>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <p className="text-muted text-xs mb-3 uppercase tracking-wider font-medium">Zone / Region Label</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Zone (EN)">
                <Input {...register('zoneEn')} />
              </Field>
              <Field label="Zone (FR)">
                <Input {...register('zoneFr')} />
              </Field>
              <Field label="Zone (AR)">
                <Input {...register('zoneAr')} dir="rtl" />
              </Field>
            </div>
          </div>
        </section>

        {/* Season */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-muted text-xs uppercase tracking-wider font-medium mb-4">Season Calendar</h2>
          <div className="space-y-3">
            {(['Pre', 'Peak', 'Post'] as const).map((phase) => (
              <div key={phase} className="flex items-center gap-4">
                <span className="text-muted text-sm w-10">{phase}</span>
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
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-muted text-xs uppercase tracking-wider font-medium mb-3">Environmental Data</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
              >
                {SUSTAINABILITY.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="UV Note" error={errors.environmental?.uvNote?.message}>
              <Input {...register('environmental.uvNote')} />
            </Field>
          </div>
        </section>

        {/* Agronomy & Intelligence */}
        <section className="bg-surface rounded-xl border border-border p-5 space-y-6">
          <h2 className="text-muted text-xs uppercase tracking-wider font-medium">Agronomy &amp; Intelligence</h2>

          {/* Soil */}
          <div>
            <p className="text-muted text-xs mb-3 uppercase tracking-wider font-medium">Soil &amp; Land</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Soil pH Min">
                <Input type="number" step="0.1" {...register('soilPhMin')} />
              </Field>
              <Field label="Soil pH Max">
                <Input type="number" step="0.1" {...register('soilPhMax')} />
              </Field>
              <Field label="Salinity Tolerance">
                <select
                  {...register('salinityTolerance')}
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">—</option>
                  {TOLERANCE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Soil Types (comma-separated)">
                <Input {...register('soilTypes')} placeholder="loam, sandy" />
              </Field>
            </div>
          </div>

          {/* Climate */}
          <div>
            <p className="text-muted text-xs mb-3 uppercase tracking-wider font-medium">Climate Requirements</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Chill Hours Min">
                <Input type="number" {...register('chillHoursMin')} />
              </Field>
              <Field label="Rainfall Min (mm/yr)">
                <Input type="number" {...register('rainfallMmMin')} />
              </Field>
              <Field label="Rainfall Max (mm/yr)">
                <Input type="number" {...register('rainfallMmMax')} />
              </Field>
              <Field label="Drought Tolerance">
                <select
                  {...register('droughtTolerance')}
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">—</option>
                  {TOLERANCE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Frost Risk Months">
                <Controller
                  name="frostRiskMonths"
                  control={control}
                  render={({ field }) => (
                    <SeasonEditor value={field.value ?? []} onChange={field.onChange} />
                  )}
                />
              </Field>
            </div>
          </div>

          {/* Economics */}
          <div>
            <p className="text-muted text-xs mb-3 uppercase tracking-wider font-medium">Economics</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Production (tonnes/yr)">
                <Input type="number" step="0.01" {...register('productionTonnesYear')} />
              </Field>
              <Field label="Export Status">
                <select
                  {...register('exportStatus')}
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">—</option>
                  {EXPORT_STATUS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </Field>
              <Field label="Price Premium Index (1.0 = baseline)">
                <Input type="number" step="0.01" {...register('pricePremiumIndex')} />
              </Field>
            </div>
          </div>

          {/* Conservation */}
          <div>
            <p className="text-muted text-xs mb-3 uppercase tracking-wider font-medium">Conservation</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Conservation Status">
                <select
                  {...register('conservationStatus')}
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">—</option>
                  {CONSERVATION_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Known Farms Count">
                <Input type="number" {...register('knownFarmsCount')} />
              </Field>
              <Field label="Seed Bank Status">
                <select
                  {...register('seedBankStatus')}
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">—</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Phenology */}
          <div>
            <p className="text-muted text-xs mb-3 uppercase tracking-wider font-medium">Phenology</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Days Flower→Harvest">
                <Input type="number" {...register('daysFlowerToHarvest')} />
              </Field>
              <Field label="Harvest Window (days)">
                <Input type="number" {...register('harvestWindowDays')} />
              </Field>
              <Field label="Pollinator Dependency">
                <select
                  {...register('pollinatorDependency')}
                  className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold"
                >
                  <option value="">—</option>
                  {POLLINATOR_DEPENDENCY.map((p) => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Sustainability */}
          <div>
            <p className="text-muted text-xs mb-3 uppercase tracking-wider font-medium">Sustainability</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Carbon Footprint (kg CO₂e / kg fruit)">
                <Input type="number" step="0.01" {...register('carbonFootprintKgCo2')} />
              </Field>
              <Field label="Post-Harvest Loss (%)">
                <Input type="number" step="0.1" {...register('postHarvestLossPct')} />
              </Field>
            </div>
          </div>
        </section>

        {/* Nutritional */}
        <section className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-muted text-xs uppercase tracking-wider font-medium">Nutritional Data</h2>
            <button
              type="button"
              onClick={() => appendNutritional({ labelEn: '', labelFr: '', labelAr: '', value: '' })}
              className="text-gold text-xs hover:text-gold/70 transition-colors px-2 py-1 border border-gold/30 rounded"
            >
              + Add Row
            </button>
          </div>

          {nutritionalFields.length === 0 ? (
            <p className="text-muted text-sm">No nutritional data. Click "+ Add Row" to add entries.</p>
          ) : (
            <div className="overflow-x-auto">
            <div className="space-y-2 min-w-[480px]">
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 mb-1">
                {['Label EN', 'Label FR', 'Label AR', 'Value', ''].map((h, i) => (
                  <span key={i} className="text-muted text-xs">{h}</span>
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
                    className="text-red-500/70 hover:text-red-600 text-sm px-2 py-1.5 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            </div>
          )}
        </section>

        {/* Image */}
        {!isNew && id && (
          <section className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-muted text-xs uppercase tracking-wider font-medium mb-4">Primary Image</h2>
            <ImageUploader
              fruitId={id}
              currentHero={(fruit?.images as any[])?.find((i: any) => i.isPrimary)?.cdnUrlHero ?? null}
              onSuccess={() => qc.invalidateQueries({ queryKey: ['admin-fruit', id] })}
            />
          </section>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gold hover:bg-gold/80 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Save Fruit'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/fruits')}
            className="text-muted hover:text-cream text-sm transition-colors px-4 py-2"
          >
            Cancel
          </button>
          {mutation.isError && (
            <p className="text-red-600 text-sm">Save failed. Please check the form and try again.</p>
          )}
        </div>
      </form>
    </div>
  );
}
