"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function QaPage() {
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort') || 'new';
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/qa?sort=${sort}`);
        setQuestions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [sort]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
            <i className="bi bi-people-fill"></i> Community Hub
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Questions</h1>
          <p className="mt-2 text-lg text-slate-600">Ask, answer, and build the shared knowledge base together.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/qa" className={`btn-ghost ${sort === 'new' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><i className="bi bi-clock-history"></i> New</Link>
          <Link href="?sort=hot" className={`btn-ghost ${sort === 'hot' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}><i className="bi bi-fire"></i> Hot</Link>
          <Link href="?sort=top" className={`btn-ghost ${sort === 'top' ? 'bg-slate-200 text-slate-800 ring-2 ring-slate-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><i className="bi bi-star-fill"></i> Top</Link>
          <Link href="/qa/ask" className="btn-primary shadow-lg shadow-indigo-500/30">
            <i className="bi bi-plus-lg"></i> Ask Question
          </Link>
        </div>
      </div>

      <div className="grid gap-5">
        {loading ? (
          /* Skeleton Loader */
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-modern p-6 animate-pulse border border-slate-100 bg-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex gap-2">
                    <div className="h-6 w-24 rounded-full bg-slate-200"></div>
                    <div className="h-6 w-16 rounded-full bg-slate-100"></div>
                  </div>
                  <div className="h-6 w-3/4 rounded bg-slate-200 mb-3"></div>
                  <div className="h-4 w-full rounded bg-slate-100 mb-2"></div>
                  <div className="h-4 w-5/6 rounded bg-slate-100"></div>
                  <div className="mt-5 h-4 w-40 rounded bg-slate-200"></div>
                </div>
                <div className="grid min-w-72 grid-cols-4 gap-3">
                  <div className="h-16 rounded-xl bg-slate-100"></div>
                  <div className="h-16 rounded-xl bg-slate-100"></div>
                  <div className="h-16 rounded-xl bg-slate-100"></div>
                  <div className="h-16 rounded-xl bg-slate-100"></div>
                </div>
              </div>
            </div>
          ))
        ) : questions.length === 0 ? (
          <div className="card-modern p-12 text-center border border-dashed border-slate-300 bg-slate-50/50">
            <div className="mx-auto w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <i className="bi bi-chat-dots text-2xl text-slate-400"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800">No questions yet</h3>
            <p className="text-slate-500 mt-1">Be the first to ask a question to the community!</p>
            <Link href="/qa/ask" className="btn-primary mt-4 inline-flex">Ask a Question</Link>
          </div>
        ) : (
          questions.map(q => {
            const score = q.upvoteCount - q.downvoteCount;
            const answersCount = q.answers?.length || 0;
            return (
            <Link key={q._id} href={`/qa/${q._id}`} className="card-modern block p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 group bg-white">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {q.category?.name && <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">{q.category.name}</span>}
                    {q.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">{q.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600 leading-relaxed">{q.body?.substring(0, 150)}</p>
                  
                  <div className="mt-5 flex items-center gap-3">
                    <div className="avatar avatar-xs shadow-sm ring-2 ring-white">{q.author?.username?.[0].toUpperCase() || 'U'}</div>
                    <p className="text-xs text-slate-500 font-medium">
                      Asked by <span className="text-slate-800 font-bold">{q.author?.username}</span> <span className="mx-1 text-slate-300">•</span> recently
                    </p>
                  </div>
                </div>
                
                {/* Stats Section */}
                <div className="grid min-w-72 grid-cols-4 gap-3 text-center text-xs font-medium text-slate-500">
                  <div className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-colors ${score > 0 ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-slate-50 border-slate-100'}`}>
                    <strong className="block text-lg mb-1">{score}</strong>
                    Score
                  </div>
                  <div className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-colors ${answersCount > 0 ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-100'}`}>
                    <strong className="block text-lg mb-1">{answersCount}</strong>
                    Answers
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl p-3 border bg-slate-50 border-slate-100">
                    <strong className="block text-lg mb-1 text-slate-700">{q.viewCount}</strong>
                    Views
                  </div>
                  <div className={`flex flex-col items-center justify-center rounded-xl p-3 border transition-colors ${q.isAnswered ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <i className={`bi ${q.isAnswered ? 'bi-check-circle-fill text-xl mb-1' : 'bi-circle text-xl mb-1'}`}></i>
                    {q.isAnswered ? 'Solved' : 'Open'}
                  </div>
                </div>
              </div>
            </Link>
            );
          })
        )}
      </div>
    </>
  );
}
