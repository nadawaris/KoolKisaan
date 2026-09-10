"use client";
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

function FaqContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';
  
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState(q);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Initial fetch or search change
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        setPage(1);
        const url = `http://localhost:5000/api/faqs?page=1&limit=10${q ? `&keyword=${encodeURIComponent(q)}` : ''}`;
        const res = await axios.get(url);
        
        const data = res.data.faqs ? res.data.faqs : (res.data.data || res.data);
        setFaqs(data);
        setHasMore(res.data.page < res.data.pages);

        if (q) {
          axios.post('http://localhost:5000/api/analytics/log-search', { query: q }).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to fetch FAQs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, [q]);

  // Infinite Scroll fetch
  useEffect(() => {
    if (page === 1) return;
    const fetchMore = async () => {
      try {
        setLoadingMore(true);
        const url = `http://localhost:5000/api/faqs?page=${page}&limit=10${q ? `&keyword=${encodeURIComponent(q)}` : ''}`;
        const res = await axios.get(url);
        
        const data = res.data.faqs ? res.data.faqs : res.data;
        setFaqs(prev => [...prev, ...data]);
        setHasMore(res.data.page < res.data.pages);
      } catch (err) {
        console.error("Failed to fetch more FAQs", err);
      } finally {
        setLoadingMore(false);
      }
    };
    fetchMore();
  }, [page, q]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );
    
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) observer.observe(sentinel);
    
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/faqs?q=${encodeURIComponent(searchInput)}`);
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Browse FAQs</h1>
          <p className="text-slate-500 mt-2 text-lg">Find answers to commonly asked questions.</p>
        </div>
        <form onSubmit={handleSearch} className="relative w-full md:w-[400px] lg:w-[500px]">
          <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
          <input 
            type="text" 
            placeholder="Search FAQs (e.g. NOC, hostel)..." 
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 text-sm shadow-sm outline-none transition-all placeholder:text-slate-400" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => router.push('/faqs')} className="badge-soft !bg-indigo-600 !text-white">All Topics</button>
      </div>

      <div className="space-y-4">
        {loading && page === 1 ? (
          <div className="text-center p-8 text-slate-500 animate-pulse">Loading FAQs from API...</div>
        ) : faqs.length === 0 ? (
          <div className="text-center p-8 text-slate-500">No FAQs found matching your search.</div>
        ) : (
          <>
            {faqs.map(faq => (
              <Link key={faq.slug} href={`/faqs/${faq.slug}`} className="block card-modern p-5 hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">{faq.title}</h3>
                  <span className="text-xs font-bold text-indigo-600">{faq.category?.name || 'General'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> {faq.viewCount}</span>
                  <span className="flex items-center gap-1 text-emerald-600"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg> +{faq.upvoteCount - faq.downvoteCount}</span>
                </div>
              </div>
            </Link>
            ))}
            
            {/* Infinite Scroll Sentinel */}
            <div id="scroll-sentinel" className="h-4 w-full"></div>
            {loadingMore && <div className="text-center py-4 text-slate-500 animate-pulse text-sm">Loading more FAQs...</div>}
            {!hasMore && faqs.length > 0 && <div className="text-center py-8 text-slate-400 text-sm">You've reached the end of the list.</div>}
          </>
        )}
      </div>
    </div>
  );
}

export default function FaqsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500 animate-pulse">Loading FAQs...</div>}>
      <FaqContent />
    </Suspense>
  );
}
