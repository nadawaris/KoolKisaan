"use client";
import Link from 'next/link';
import { useState, useEffect, Suspense, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(!!searchParams.get('token'));
  const hasFetchedProfile = useRef(false);

  useEffect(() => {
    // Intercept Google OAuth token redirect
    const token = searchParams.get('token');
    if (token && !hasFetchedProfile.current) {
      hasFetchedProfile.current = true;
      axios.get('http://localhost:5000/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          login(token, res.data);
          if (res.data.needsOnboarding) {
            router.push('/onboarding');
          } else {
            router.push('/');
          }
        })
        .catch(err => {
          console.error('Google Auth Failed:', err);
          setError('Google Authentication Failed.');
          setIsProcessingOAuth(false);
        });
    }
  }, [searchParams, login, router]);

  // If user is already logged in, redirect them to dashboard (or onboarding)
  useEffect(() => {
    if (user) {
      if ((user as any).needsOnboarding) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      login(res.data.token, res.data);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (isProcessingOAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] py-10">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
          <i className="bi bi-arrow-repeat animate-spin text-3xl text-indigo-600"></i>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Authenticating...</h2>
        <p className="text-slate-500 font-medium">Please wait while we log you in securely.</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden py-10">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-[440px] px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 mb-6 transform transition hover:scale-105">
            <i className="bi bi-shield-lock text-2xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Please enter your details to sign in.</p>
        </div>

        <div className="backdrop-blur-xl bg-white/80 border border-white shadow-2xl rounded-[2rem] p-8 sm:p-10 transition-all">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <i className="bi bi-exclamation-circle-fill"></i>
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <i className="bi bi-envelope"></i>
                </div>
                <input 
                  type="email" id="email" 
                  value={email} onChange={e => setEmail(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                  placeholder="Enter your email" required 
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <i className="bi bi-key"></i>
                </div>
                <input 
                  type="password" id="password" 
                  value={password} onChange={e => setPassword(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                  placeholder="••••••••" required 
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2">
              {loading ? <i className="bi bi-arrow-repeat animate-spin text-lg"></i> : 'Sign in to account'}
            </button>
          </form>

          <div className="mt-8 relative flex items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="mt-6">
            <a href="http://localhost:5000/api/auth/google" className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Sign in with Google
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-slate-600 font-medium">
          Don't have an account? <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-all">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-slate-500 animate-pulse">Loading login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
