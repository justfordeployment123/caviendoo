import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/auth';

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  email:           z.string().email('Enter a valid email'),
  name:            z.string().max(100).optional(),
  currentPassword: z.string().min(1, 'Required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword:     z.string().min(10, 'Minimum 10 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm   = z.infer<typeof profileSchema>;
type PasswordForm  = z.infer<typeof passwordSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-muted text-xs font-medium mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <input
      ref={ref}
      {...props}
      className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 text-cream text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20"
    />
  ),
);

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>
>(({ label, error, ...props }, ref) => {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} error={error}>
      <div className="relative">
        <input
          ref={ref}
          {...props}
          type={show ? 'text' : 'password'}
          className="w-full bg-canvas border border-border rounded-lg px-3 py-1.5 pr-9 text-cream text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-2.5 flex items-center text-muted hover:text-cream transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </Field>
  );
});

function StatusMsg({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <p className={`text-sm mt-1 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</p>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Settings() {
  const { admin, setAuth, token, expiresAt, logout } = useAuthStore();
  const navigate = useNavigate();

  const [profileStatus, setProfileStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // ── Profile form ──────────────────────────────────────────────────────────
  const {
    register: regP,
    handleSubmit: handleP,
    formState: { errors: errP, isSubmitting: submittingP },
  } = useForm<ProfileForm>({
    resolver:      zodResolver(profileSchema),
    defaultValues: { email: admin?.email ?? '', name: admin?.name ?? '' },
  });

  const submitProfile = async (values: ProfileForm) => {
    setProfileStatus(null);
    try {
      const { data } = await apiClient.patch('/admin/settings/profile', values);
      if (token && expiresAt) {
        setAuth(token, expiresAt, data.admin);
      }
      setProfileStatus({ ok: true, msg: 'Profile updated.' });
    } catch (err: any) {
      setProfileStatus({ ok: false, msg: err?.response?.data?.error ?? 'Update failed.' });
    }
  };

  // ── Password form ─────────────────────────────────────────────────────────
  const {
    register: regW,
    handleSubmit: handleW,
    formState: { errors: errW, isSubmitting: submittingW },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const submitPassword = async (values: PasswordForm) => {
    setPasswordStatus(null);
    try {
      await apiClient.patch('/admin/settings/password', {
        currentPassword: values.currentPassword,
        newPassword:     values.newPassword,
      });
      setPasswordStatus({ ok: true, msg: 'Password changed. Signing you out…' });
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setPasswordStatus({ ok: false, msg: err?.response?.data?.error ?? 'Update failed.' });
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      <h1 className="font-display text-cream text-2xl font-semibold mb-8">Settings</h1>

      {/* ── Profile ────────────────────────────────────────────────────────── */}
      <section className="bg-surface rounded-xl border border-border p-5 space-y-4 mb-6">
        <h2 className="text-muted text-xs uppercase tracking-wider font-medium">Profile</h2>

        <form onSubmit={handleP(submitProfile)} className="space-y-4">
          <Field label="Name" error={errP.name?.message}>
            <Input {...regP('name')} placeholder="Your name" />
          </Field>
          <Field label="Email" error={errP.email?.message}>
            <Input {...regP('email')} type="email" />
          </Field>
          <PasswordInput
            label="Current password (required to save)"
            error={errP.currentPassword?.message}
            {...regP('currentPassword')}
            autoComplete="current-password"
          />

          {profileStatus && <StatusMsg {...profileStatus} />}

          <button
            type="submit"
            disabled={submittingP}
            className="px-4 py-1.5 bg-gold hover:bg-gold/80 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
          >
            {submittingP ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      {/* ── Password ───────────────────────────────────────────────────────── */}
      <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-muted text-xs uppercase tracking-wider font-medium">Change password</h2>

        <form onSubmit={handleW(submitPassword)} className="space-y-4">
          <PasswordInput
            label="Current password"
            error={errW.currentPassword?.message}
            {...regW('currentPassword')}
            autoComplete="current-password"
          />
          <PasswordInput
            label="New password (min. 10 characters)"
            error={errW.newPassword?.message}
            {...regW('newPassword')}
            autoComplete="new-password"
          />
          <PasswordInput
            label="Confirm new password"
            error={errW.confirmPassword?.message}
            {...regW('confirmPassword')}
            autoComplete="new-password"
          />

          {passwordStatus && <StatusMsg {...passwordStatus} />}

          <button
            type="submit"
            disabled={submittingW}
            className="px-4 py-1.5 bg-gold hover:bg-gold/80 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
          >
            {submittingW ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </section>
    </div>
  );
}
