"use client";
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { use, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function FaqDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [faq, setFaq] = useState<any>(null);
  const [relatedFaqs, setRelatedFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const { user } = useAuth();
  
  const [isSuggestEditOpen, setIsSuggestEditOpen] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [suggestedAnswer, setSuggestedAnswer] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  useEffect(() => {
    const fetchFaqData = async () => {
      try {
        setLoading(true);
        // Fetch current FAQ
        const res = await axios.get(`http://localhost:5000/api/faqs/${params.slug}`);
        const currentFaq = res.data;
        setFaq(currentFaq);
        
        // Fetch related FAQs from the same category
        if (currentFaq?.category?.slug) {
          const relatedRes = await axios.get(`http://localhost:5000/api/faqs?categorySlug=${currentFaq.category.slug}&limit=5`);
          // Filter out the current FAQ and keep up to 5
          const filtered = (relatedRes.data.faqs || []).filter((f: any) => f._id !== currentFaq._id).slice(0, 5);
          setRelatedFaqs(filtered);
        }
      } catch (err) {
        console.error("Error fetching FAQ data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqData();
  }, [params.slug]);

  useEffect(() => {
    if (user && faq) {
      axios.get('http://localhost:5000/api/bookmarks', {
        headers: { Authorization: `Bearer ${user.token}` }
      }).then(res => {
        if (res.data.some((b: any) => b.itemId?._id === faq._id)) {
          setBookmarked(true);
        }
      }).catch(console.error);
    }
  }, [user, faq]);

  const toggleBookmark = async () => {
    if (!user) return alert("Please sign in to bookmark this FAQ.");
    try {
      const res = await axios.post('http://localhost:5000/api/bookmarks/toggle', {
        itemId: faq._id,
        itemType: 'faq'
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setBookmarked(res.data.bookmarked);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Action failed. Please try logging out and logging back in.");
    }
  };

  const handleReport = async (itemId: string, itemType: string) => {
    if (!user) return alert('Please login to report content');
    const reason = window.prompt("Why are you reporting this FAQ?");
    if (!reason?.trim()) return;
    
    try {
      await axios.post(`http://localhost:5000/api/reports`, 
        { itemId, itemType, reason }, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('FAQ reported to moderators.');
    } catch (err: any) {
      console.error("Failed to report", err);
      alert(err.response?.data?.message || "Action failed. Please try logging out and logging back in.");
    }
  };

  const handleVote = async (voteType: number) => {
    if (!user) return alert('Please login to vote.');
    try {
      await axios.post(`http://localhost:5000/api/faqs/${faq._id}/vote`, 
        { voteType },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setFaq({ 
        ...faq, 
        upvoteCount: voteType === 1 ? faq.upvoteCount + 1 : faq.upvoteCount,
        downvoteCount: voteType === -1 ? faq.downvoteCount + 1 : faq.downvoteCount
      });
    } catch (err: any) {
      console.error("Failed to vote", err);
      alert(err.response?.data?.message || "Action failed. Please try logging out and logging back in.");
    }
  };

  const handleSuggestEditClick = () => {
    if (!user) return alert("Please login to suggest an edit.");
    setSuggestedTitle(faq.title);
    setSuggestedAnswer(faq.answer ? faq.answer.replace(/<[^>]+>/g, '') : '');
    setIsSuggestEditOpen(true);
  };

  const submitEditSuggestion = async () => {
    if (!suggestedTitle.trim() || !suggestedAnswer.trim()) return alert("Title and Answer cannot be empty.");
    setIsSubmittingEdit(true);
    try {
      await axios.post(`http://localhost:5000/api/faqs/${faq._id}/suggest-edit`, 
        { proposedTitle: suggestedTitle, proposedAnswer: suggestedAnswer },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("Edit suggestion submitted successfully! It is now pending moderator approval.");
      setIsSuggestEditOpen(false);
    } catch (err: any) {
      console.error("Failed to suggest edit", err);
      alert(err.response?.data?.message || "Failed to submit suggestion. Please try logging out and logging back in.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto p-8 text-center animate-pulse text-slate-500">Loading FAQ...</div>;
  if (!faq) return <div className="max-w-7xl mx-auto p-8 text-center text-slate-500">FAQ not found.</div>;

  const score = (faq.upvoteCount || 0) - (faq.downvoteCount || 0);

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-300">
      <div className="text-sm font-medium text-slate-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-indigo-600">Dashboard</Link>
        <i className="bi bi-chevron-right text-[10px]"></i>
        <Link href={`/faqs?category=${faq.category?.slug}`} className="hover:text-indigo-600">{faq.category?.name || 'General'}</Link>
        <i className="bi bi-chevron-right text-[10px]"></i>
        <span className="text-slate-400">{faq.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Main Content Area - Left Column */}
        <div className="flex-1 w-full min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 mb-6 border border-indigo-100">
              {faq.category?.name || 'General'}
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">{faq.title}</h1>
            <p className="text-lg text-slate-600 mb-6">{faq.question}</p>
            
            <div className="flex items-center gap-6 py-4 mb-8 border-y border-slate-100 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <i className="bi bi-person text-slate-400"></i>
                <span className="text-slate-700">{faq.author?.username || 'admin'}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="bi bi-calendar3 text-slate-400"></i>
                <span>{new Date(faq.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="bi bi-eye text-slate-400"></i>
                <span>{faq.viewCount || 1} views</span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">Answer</h2>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed prose-a:text-indigo-600 hover:prose-a:text-indigo-800 prose-headings:font-bold prose-headings:text-slate-900" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer) }} />
          </div>
        </div>

        {/* Sidebar Area - Right Column */}
        <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 space-y-6">
          
          {/* Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Actions</h3>
            {!user ? (
              <button onClick={() => router.push('/login')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm">
                Login to interact
              </button>
            ) : (
              <div className="space-y-3">
                <button onClick={handleSuggestEditClick} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <i className="bi bi-pencil-square"></i> Suggest Edit
                </button>
                <div className="flex gap-3">
                  <button onClick={toggleBookmark} className={`flex-1 py-2.5 border rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${bookmarked ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <i className={`bi ${bookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i> Save
                  </button>
                  <button onClick={() => handleReport(faq._id, 'faq')} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-rose-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                    <i className="bi bi-flag"></i> Report
                  </button>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => handleVote(1)} className="flex-1 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm">
                    <i className="bi bi-hand-thumbs-up"></i> {faq.upvoteCount || 0}
                  </button>
                  <button onClick={() => handleVote(-1)} className="flex-1 py-2 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm">
                    <i className="bi bi-hand-thumbs-down"></i> {faq.downvoteCount || 0}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
              <span className="text-2xl font-black text-slate-900">{score}</span>
              <span className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Score</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
              <span className="text-2xl font-black text-slate-900">{faq.viewCount || 1}</span>
              <span className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Views</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm">
              <span className="text-xl font-black text-slate-900 mt-1">v1</span>
              <span className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Version</span>
            </div>
          </div>

          {/* Related FAQs Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Related FAQs</h3>
            {relatedFaqs.length === 0 ? (
              <p className="text-sm text-slate-500">No related FAQs found.</p>
            ) : (
              <div className="space-y-2">
                {relatedFaqs.map(related => (
                  <Link 
                    key={related._id} 
                    href={`/faqs/${related.slug}`}
                    className="block p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <p className="text-sm font-bold text-slate-700 leading-tight">{related.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Suggest Edit Modal */}
      {isSuggestEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold flex items-center text-slate-800"><i className="bi bi-pencil-square text-indigo-600 mr-3 text-2xl"></i>Suggest an Edit</h3>
              <button onClick={() => setIsSuggestEditOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 p-2 rounded-full transition-all">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Your Suggestion</label>
                <div className="relative group">
                  <textarea 
                    value={suggestedAnswer}
                    onChange={e => setSuggestedAnswer(e.target.value)}
                    placeholder="e.g. <p>Leave is not permitted. If you are also attending classes or exams, you will be relieved from the internship immediately and will need to join the next batch when it starts.</p>"
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-mono text-sm leading-relaxed shadow-sm"
                    rows={10}
                  />
                </div>
              </div>
              <div className="text-sm text-indigo-800 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-3 items-start">
                <i className="bi bi-info-circle-fill text-indigo-500 text-lg mt-0.5"></i>
                <p className="leading-relaxed font-medium">Your suggested edit will be reviewed by a moderator. If approved, the FAQ will be permanently updated with your changes!</p>
              </div>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button onClick={() => setIsSuggestEditOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={submitEditSuggestion} disabled={isSubmittingEdit} className="btn-primary !rounded-xl !px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmittingEdit ? (
                  <><i className="bi bi-arrow-repeat animate-spin mr-2"></i>Submitting...</>
                ) : 'Submit Suggestion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
