"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [faqRes, catRes] = await Promise.all([
          axios.get('http://localhost:5000/api/faqs'),
          axios.get('http://localhost:5000/api/faqs/categories')
        ]);
        setFaqs(faqRes.data.faqs ? faqRes.data.faqs : (faqRes.data.data || faqRes.data));
        setCategories(catRes.data.data || catRes.data);
      } catch (err) {}
    };
    fetchData();
  }, []);

  return (
    <>
      <section className="hero-panel mb-8">
        <div className="max-w-3xl">
          <p className="eyebrow mb-3">Knowledge dashboard</p>
          <h1 className="page-title mb-4">Community Powered Knowledge Base</h1>
          <p className="mb-6 max-w-2xl text-base text-slate-600">Find answers, contribute knowledge, and help others.</p>
          <form method="get" action="/faqs" className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <i className="bi bi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input className="search-input" name="q" type="search" aria-label="Search FAQs" placeholder="Search FAQs, topics, policies..." />
            </div>
            <Link href="/qa/ask" className="btn-primary">Ask Question</Link>
          </form>
        </div>
      </section>

      <section className="mb-8">
        <div className="section-header">
          <div>
            <h2 className="section-title">Popular Categories</h2>
            <p className="text-sm text-slate-500">Browse high-signal topics by department.</p>
          </div>
          <Link href="/faqs" className="btn-ghost">View all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map(cat => {
            return (
              <Link key={cat.slug} href={`/category/${cat.slug}`} className="card-modern p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                    <i className="bi bi-folder2-open text-xl"></i>
                  </span>
                  <i className="bi bi-arrow-up-right text-slate-300"></i>
                </div>
                <h3 className="font800 text-slate-950">{cat.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{cat.description || "Community answers and FAQs."}</p>
                <p className="mt-4 text-xs font700 text-slate-400">{cat.questionCount || 0} questions</p>
              </Link>
            );
          })}
          {categories.length === 0 && (
             <div className="text-sm text-slate-500 col-span-full">Loading categories...</div>
          )}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        <section>
          <div className="section-header">
            <div>
              <h2 className="section-title">Trending Questions</h2>
              <p className="text-sm text-slate-500">Popular FAQs ranked by views and helpful votes.</p>
            </div>
          </div>
          <div className="space-y-4">
            {faqs.slice(0, 5).map(faq => (
              <Link key={faq.slug} href={`/faqs/${faq.slug}`} className="card-modern block p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="badge-soft">{faq.category?.name || "General"}</span>
                  {faq.tags && faq.tags.slice(0, 2).map((tag: string) => <span key={tag} className="tag-pill">{tag}</span>)}
                </div>
                <h3 className="text-lg font800 text-slate-950">{faq.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{faq.question?.substring(0, 100)}</p>
                <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span><i className="bi bi-eye"></i> {faq.viewCount} views</span>
                  <span><i className="bi bi-hand-thumbs-up"></i> {faq.upvoteCount} score</span>
                </div>
              </Link>
            ))}
            {faqs.length === 0 && (
              <div className="card-modern p-6 text-sm text-slate-500">No FAQs yet. Start by adding one.</div>
            )}
          </div>
        </section>

        <aside className="space-y-8">
          <section>
            <div className="section-header">
              <div>
                <h2 className="section-title">Recent Questions</h2>
                <p className="text-sm text-slate-500">Freshly published knowledge.</p>
              </div>
            </div>
            <div className="card-modern divide-y divide-slate-100">
              {faqs.slice(0, 5).map(faq => (
                <Link key={`recent-${faq.slug}`} href={`/faqs/${faq.slug}`} className="block p-4 transition hover:bg-slate-50">
                  <p className="font700 text-slate-900">{faq.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{faq.category?.name || "General"}</p>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
