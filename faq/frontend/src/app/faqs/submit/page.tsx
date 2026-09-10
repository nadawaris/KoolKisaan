"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SubmitFaqPage() {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Fetch categories for the dropdown
    axios.get('http://localhost:5000/api/faqs/categories').then(res => {
      setCategories(res.data);
      if (res.data.length > 0) setCategory(res.data[0]._id);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to submit an FAQ.");
      return;
    }
    setLoading(true);
    setError('');
    
    // Auto-generate a slug from the title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    try {
      await axios.post('http://localhost:5000/api/faqs', 
        { title, slug, question, answer, category },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      router.push('/faqs/my-submissions');
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit FAQ");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center text-slate-500">Please sign in to propose an FAQ.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Propose a new FAQ</h1>
        <p className="text-slate-500 mt-2">Submit a question and answer pair to be reviewed by moderators for the official knowledge base.</p>
      </div>

      <div className="card-modern p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm">{error}</div>}
          
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-1.5">Title (Short Summary)</label>
            <input 
              type="text" 
              id="title" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" 
              placeholder="e.g. How to reset password" 
              required 
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-bold text-slate-700 mb-1.5">Category</label>
            <select 
              id="category" 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" 
              required
            >
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="question" className="block text-sm font-bold text-slate-700 mb-1.5">The Question</label>
            <textarea 
              id="question" 
              rows={3} 
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm resize-none min-h-[80px]" 
              placeholder="Write the full question here..." 
              required
            ></textarea>
          </div>

          <div>
            <label htmlFor="answer" className="block text-sm font-bold text-slate-700 mb-1.5">The Answer</label>
            <textarea 
              id="answer" 
              rows={5} 
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm resize-none min-h-[120px]" 
              placeholder="Provide a simple, clear answer in a single paragraph..." 
              required
            ></textarea>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="btn-soft px-6">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary px-8">
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
