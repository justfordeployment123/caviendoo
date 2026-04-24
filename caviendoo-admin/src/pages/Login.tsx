import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/auth';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setServerError('');
    try {
      const { data } = await apiClient.post('/admin/login', values);
      setAuth(data.token, data.expiresAt, data.admin);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Login failed';
      setServerError(typeof msg === 'string' ? msg : 'Login failed');
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-gold text-4xl font-semibold tracking-wide">Caviendoo</h1>
          <p className="text-muted text-sm mt-1">Admin Panel</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-surface rounded-xl p-6 space-y-4 border border-border shadow-sm"
        >
          <div>
            <label className="block text-cream text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-cream text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
              placeholder="admin@caviendoo.com"
            />
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-cream text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-cream text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {serverError && (
            <p className="text-red-600 text-sm text-center">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold hover:bg-gold/80 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
