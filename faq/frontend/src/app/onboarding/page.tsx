"use client";
import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function OnboardingContent() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const router = useRouter();

  // If user is NOT logged in or doesn't need onboarding, kick them out
  useEffect(() => {
    if (user && !(user as any).needsOnboarding) {
      router.push('/');
    } else if (!user) {
      router.push('/login');
    } else if (user && !username) {
      // Pre-fill the input with the generated username for convenience
      setUsername(user.username);
    }
  }, [user, router, username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', 
        { username },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // The backend returns a new token and user data without needsOnboarding
      login(res.data.token, res.data);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // Avoid flashing content while redirecting

  return (
    <div className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden py-10">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-[480px] px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-xl shadow-emerald-500/30 mb-6 transform transition hover:scale-105">
            <i className="bi bi-person-badge text-2xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Welcome to Yaksha!</h1>
          <p className="text-slate-500 font-medium">Since this is your first time signing in with Google, please choose a unique public username.</p>
        </div>

        <div className="backdrop-blur-xl bg-white/80 border border-white shadow-2xl rounded-[2rem] p-8 sm:p-10 transition-all">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <i className="bi bi-exclamation-circle-fill"></i>
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-bold text-slate-700">Choose your Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <i className="bi bi-at"></i>
                </div>
                <input 
                  type="text" id="username" 
                  value={username} onChange={e => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                  placeholder="e.g. techwizard" required 
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">No spaces allowed. Must be unique.</p>
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2">
              {loading ? <i className="bi bi-arrow-repeat animate-spin text-lg"></i> : 'Save Profile & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-slate-500 animate-pulse">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
