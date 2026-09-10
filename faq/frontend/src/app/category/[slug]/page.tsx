"use client";

import Link from 'next/link';
import { use, useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'isomorphic-dompurify';

export default function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryFaqs = async () => {
      try {
        setLoading(true);
        const catRes = await axios.get('http://localhost:5000/api/faqs/categories');
        const categories = catRes.data.data || catRes.data;
        const currentCat = categories.find((c: any) => c.slug === params.slug);
        if (currentCat) setCategory(currentCat);

        const faqRes = await axios.get(`http://localhost:5000/api/faqs?categorySlug=${params.slug}&limit=100`);
        setFaqs(faqRes.data.faqs ? faqRes.data.faqs : (faqRes.data.data || faqRes.data));
      } catch (err) {
        console.error("Failed to fetch category", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryFaqs();
  }, [params.slug]);

  const expandAll = () => {
    document.querySelectorAll('details.faq-q').forEach((detail: any) => {
      detail.open = true;
    });
  };

  const collapseAll = () => {
    document.querySelectorAll('details.faq-q').forEach((detail: any) => {
      detail.open = false;
    });
  };

  return (
    <div className="max-w-[56rem] mx-auto w-full pt-8 px-4 pb-20">
      
      {/* Header section - completely normal block flow */}
      <div className="w-full bg-white border border-slate-200 p-5 md:p-6 rounded-2xl relative overflow-hidden mb-6">
        <div className="relative z-10 flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white text-xl shadow-md shadow-indigo-600/20">
            <i className="bi bi-folder2-open"></i>
          </span>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{category?.name || params.slug}</h1>
            <p className="text-slate-500 mt-0.5 text-sm">{category?.description || "Browse all FAQs in this category."}</p>
          </div>
        </div>
      </div>



      {/* FAQ LIST - No absolute/relative positioning, completely normal document flow */}
      <div className="flex flex-col gap-4 w-full">
        {loading ? (
          <div className="text-center p-12 bg-white border border-slate-200 rounded-2xl animate-pulse text-slate-500 font-medium w-full">Loading FAQs...</div>
        ) : faqs.length === 0 ? (
          <div className="text-center p-16 bg-white rounded-2xl border-dashed border-2 border-slate-200 w-full">
            <i className="bi bi-folder-x text-5xl mb-4 text-slate-300 block"></i>
            <p className="text-lg font-medium text-slate-600">No FAQs found in this category.</p>
          </div>
        ) : (
          faqs.map((faq, idx) => (
            <details key={faq._id} id={`q-${faq._id}`} className="faq-q group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden w-full">
              <summary className="cursor-pointer px-6 py-5 flex gap-4 items-center select-none hover:bg-slate-50/50">
                <span className="font-extrabold text-indigo-600 text-base">{idx + 1}.</span>
                <div className="flex-1">
                  <h3 className="font-bold text-[15px] text-slate-800">{faq.title}</h3>
                </div>
                <div className="shrink-0 text-slate-400">
                  <i className="bi bi-chevron-down text-lg"></i>
                </div>
              </summary>
              <div className="px-6 pb-6 pt-0 pl-14 prose prose-slate max-w-none prose-a:text-indigo-600 hover:prose-a:text-indigo-800">
                <div className="text-slate-600 leading-relaxed text-[15px]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer) }} />
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-4 text-sm font-semibold text-slate-400">
                    <span className="flex items-center gap-1"><i className="bi bi-eye"></i> {faq.viewCount} views</span>
                    <span className="flex items-center gap-1 text-emerald-500"><i className="bi bi-hand-thumbs-up"></i> {faq.upvoteCount} upvotes</span>
                  </div>
                  <Link href={`/faqs/${faq.slug}`} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
                    View details / Suggest Edit
                  </Link>
                </div>
              </div>
            </details>
          ))
        )}
      </div>

    </div>
  );
}
