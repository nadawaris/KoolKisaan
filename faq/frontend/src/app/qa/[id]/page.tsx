"use client";

import Link from 'next/link';
import { useState, useEffect, use } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

export default function QaThreadPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [data, setData] = useState<any>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [newComment, setNewComment] = useState<{ [answerId: string]: string }>({});
  const [newAnswer, setNewAnswer] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { socket } = useSocket();
  let typingTimeout: NodeJS.Timeout;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/qa/${params.id}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (user && data?.question) {
      axios.get('http://localhost:5000/api/bookmarks', {
        headers: { Authorization: `Bearer ${user.token}` }
      }).then(res => {
        if (res.data.some((b: any) => b.itemId?._id === data.question._id)) {
          setBookmarked(true);
        }
      }).catch(console.error);
    }
  }, [user, data]);

  useEffect(() => {
    if (socket && params.id) {
      socket.emit('join_thread', params.id);

      const handleUserTyping = ({ username }: { username: string }) => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.add(username);
          return next;
        });
      };

      const handleUserStopTyping = ({ username }: { username: string }) => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(username);
          return next;
        });
      };

      socket.on('user_typing', handleUserTyping);
      socket.on('user_stop_typing', handleUserStopTyping);

      return () => {
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stop_typing', handleUserStopTyping);
      };
    }
  }, [socket, params.id]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewAnswer(e.target.value);
    if (socket && user) {
      socket.emit('typing', { threadId: params.id, username: user.username });
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('stop_typing', { threadId: params.id, username: user.username });
      }, 2000);
    }
  };

  const toggleBookmark = async () => {
    if (!user) return alert('Please login to bookmark');
    try {
      const res = await axios.post(`http://localhost:5000/api/bookmarks/toggle`, { 
        itemId: data.question._id, 
        itemType: 'question' 
      });
      setBookmarked(res.data.bookmarked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await axios.post(`http://localhost:5000/api/qa/answer/${answerId}/accept`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Refresh thread
      const res = await axios.get(`http://localhost:5000/api/qa/${params.id}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to accept answer", err);
    }
  };

  const handlePostComment = async (answerId: string) => {
    if (!newComment[answerId]?.trim()) return;
    try {
      const headers = user ? { Authorization: `Bearer ${user.token}` } : {};
      await axios.post(`http://localhost:5000/api/qa/answer/${answerId}/comments`, 
        { body: newComment[answerId] }, 
        { headers }
      );
      setNewComment(prev => ({ ...prev, [answerId]: '' }));
      // Refresh thread
      const res = await axios.get(`http://localhost:5000/api/qa/${params.id}`);
      setData(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || "Failed to post comment");
      console.error("Failed to post comment", err);
    }
  };

  const handleVoteQuestion = async (voteType: number) => {
    if (!user) return alert('Please login to vote');
    try {
      await axios.post(`http://localhost:5000/api/qa/${question._id}/vote`, 
        { voteType }, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const res = await axios.get(`http://localhost:5000/api/qa/${params.id}`);
      setData(res.data);
    } catch (err) { console.error("Failed to vote", err); }
  };

  const handleVoteAnswer = async (answerId: string, voteType: number) => {
    if (!user) return alert('Please login to vote');
    try {
      await axios.post(`http://localhost:5000/api/qa/answer/${answerId}/vote`, 
        { voteType }, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const res = await axios.get(`http://localhost:5000/api/qa/${params.id}`);
      setData(res.data);
    } catch (err) { console.error("Failed to vote", err); }
  };

  const handlePostAnswer = async () => {
    if (!user) return alert('Please login to post an answer');
    if (!newAnswer.trim()) return;
    try {
      await axios.post(`http://localhost:5000/api/qa/${question._id}/answers`, 
        { body: newAnswer }, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNewAnswer('');
      const res = await axios.get(`http://localhost:5000/api/qa/${params.id}`);
      setData(res.data);
    } catch (err: any) { 
      alert(err.response?.data?.message || err.message || "Failed to post answer");
      console.error("Failed to post answer", err); 
    }
  };

  const handleReport = async (itemId: string, itemType: string) => {
    if (!user) return alert('Please login to report content');
    const reason = window.prompt("Why are you reporting this content?");
    if (!reason?.trim()) return;
    
    try {
      await axios.post(`http://localhost:5000/api/reports`, 
        { itemId, itemType, reason }, 
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert('Content reported to moderators.');
    } catch (err) {
      console.error("Failed to report", err);
    }
  };

  if (!data) return (
    <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <div className="card-modern p-6 animate-pulse bg-white">
          <div className="mb-4 h-6 w-32 rounded-full bg-slate-100"></div>
          <div className="h-8 w-3/4 rounded bg-slate-200 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-slate-100"></div>
            <div className="h-4 w-5/6 rounded bg-slate-100"></div>
            <div className="h-4 w-4/6 rounded bg-slate-100"></div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="card-modern p-5 animate-pulse bg-white">
          <div className="h-6 w-24 rounded bg-slate-200 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-slate-100"></div>
            <div className="h-4 w-full rounded bg-slate-100"></div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const question = data.question;
  const answers = data.answers || [];

  return (
    <>
      <nav className="breadcrumb mb-6">
        <Link href="/faqs">Dashboard</Link>
        <i className="bi bi-chevron-right text-xs"></i>
        <Link href="/qa">Questions</Link>
        <i className="bi bi-chevron-right text-xs"></i>
        <span className="text-slate-700 font-semibold truncate max-w-xs">{question.title}</span>
      </nav>

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="space-y-6 min-w-0">
          {/* Question card */}
          {/* Question card */}
          <section className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {question.category?.name && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">{question.category.name}</span>}
                {question.tags?.map((tag: string) => <span key={tag} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">{tag}</span>)}
              </div>
              
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">{question.title}</h1>
              
              <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed prose-a:text-indigo-600">
                <ReactMarkdown>{question.body}</ReactMarkdown>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-sm text-[10px]">{question.author?.username?.[0].toUpperCase() || 'U'}</div>
                  <strong className="text-slate-800">{question.author?.username}</strong>
                </div>
                <span className="flex items-center gap-1.5"><i className="bi bi-calendar3 text-indigo-400"></i> Asked recently</span>
                <span className="flex items-center gap-1.5"><i className="bi bi-eye text-indigo-400"></i> {question.viewCount} views</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 px-5 py-3 sm:px-6 border-t border-slate-100">
              <div className="flex gap-2">
                <button onClick={() => handleVoteQuestion(1)} className={`border px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm font-bold ${question.upvotes?.includes(user?._id) ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700'}`}>
                  <i className="bi bi-caret-up-fill text-sm"></i> {question.upvoteCount}
                </button>
                <button onClick={() => handleVoteQuestion(-1)} className={`border px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm font-bold ${question.downvotes?.includes(user?._id) ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 text-slate-700'}`}>
                  <i className="bi bi-caret-down-fill text-sm"></i> {question.downvoteCount}
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleReport(question._id, 'question')}
                  className="text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 text-xs py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 font-bold"
                >
                  <i className="bi bi-flag"></i> Report
                </button>
                <button 
                  onClick={toggleBookmark}
                  className={`text-xs py-1.5 px-4 rounded-lg transition-all flex items-center gap-1.5 shadow-sm font-bold ${bookmarked ? 'bg-indigo-600 text-white border border-indigo-600 shadow-indigo-200 hover:bg-indigo-700' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <i className={`bi ${bookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i> {bookmarked ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </section>

          {/* Answers Section */}
          {/* Answers Section */}
          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{answers.length} Answer{answers.length !== 1 && 's'}</h2>
            </div>

            <div className="space-y-6">
              {answers.map((ans: any) => (
                <article key={ans._id} className={`bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] border ${ans.isAccepted ? 'border-emerald-500 ring-2 ring-emerald-50' : ans.isAI ? 'border-indigo-400 ring-2 ring-indigo-50 shadow-indigo-100' : 'border-slate-100'}`}>
                  {ans.isAccepted && (
                    <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 px-5 py-2 text-white font-bold text-xs flex items-center gap-2 shadow-inner">
                      <i className="bi bi-check-circle-fill text-sm"></i> Accepted by Author
                    </div>
                  )}
                  {ans.isAI && !ans.isAccepted && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-white font-bold text-xs flex items-center gap-2 shadow-inner">
                      <i className="bi bi-robot text-sm"></i> AI Auto-Answer
                    </div>
                  )}
                  <div className={`p-5 sm:p-6 ${ans.isAccepted ? 'bg-emerald-50/30' : ans.isAI ? 'bg-indigo-50/20' : 'bg-white'}`}>
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-3">
                        {ans.isAI ? (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-500/30">✨</div>
                            <div>
                              <div className="font-black text-indigo-700 flex items-center gap-1.5">
                                Yaksha Bot <i className="bi bi-patch-check-fill text-indigo-500 text-xs"></i>
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400">{new Date(ans.createdAt).toLocaleDateString()}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">{ans.author?.username?.[0]?.toUpperCase() || 'A'}</div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{ans.author?.username || 'Anonymous'}</div>
                              <div className="text-[11px] font-semibold text-slate-400">{new Date(ans.createdAt).toLocaleDateString()}</div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        {!ans.isAccepted && user?._id === data.question.author?._id && (
                          <button onClick={() => handleAcceptAnswer(ans._id)} className="bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5">
                            <i className="bi bi-check2-circle text-sm"></i> Accept
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
                      <ReactMarkdown>{ans.body}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3 sm:px-6">
                    <button onClick={() => handleVoteAnswer(ans._id, 1)} className={`border w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-colors ${ans.upvotes?.includes(user?._id) ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700'}`}>
                      <i className="bi bi-caret-up-fill text-sm"></i>
                    </button>
                    <span className="px-1 text-sm font-black text-slate-700">{ans.upvoteCount - ans.downvoteCount}</span>
                    <button onClick={() => handleVoteAnswer(ans._id, -1)} className={`border w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-colors ${ans.downvotes?.includes(user?._id) ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 text-slate-700'}`}>
                      <i className="bi bi-caret-down-fill text-sm"></i>
                    </button>
                    <button onClick={() => handleReport(ans._id, 'answer')} className="text-slate-400 hover:text-slate-700 ml-auto p-1.5 rounded-lg transition-colors"><i className="bi bi-flag text-sm"></i></button>
                  </div>

                  {/* Comments Section */}
                  <div className="px-5 sm:px-6 pb-5 bg-slate-50/80">
                    <div className="pt-2 space-y-3">
                      {ans.comments && ans.comments.map((comment: any) => (
                        <div key={comment._id} className="text-xs bg-white border border-slate-200/60 rounded-xl p-3 flex gap-3 shadow-sm">
                           <div className="w-6 h-6 shrink-0 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-[10px]">{comment.author?.username?.[0]?.toUpperCase() || 'A'}</div>
                           <div className="flex-1">
                             <div className="flex items-baseline gap-2 mb-0.5">
                               <span className="font-bold text-slate-900">{comment.author?.username || 'Anonymous'}</span>
                               <span className="text-[10px] font-medium text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                             </div>
                             <div className="text-slate-600 leading-relaxed">{comment.body}</div>
                           </div>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-4 relative items-start">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-[10px]">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
                        <div className="flex-1 relative">
                          <input 
                            type="text" 
                            value={newComment[ans._id] || ''} 
                            onChange={e => setNewComment(prev => ({ ...prev, [ans._id]: e.target.value }))}
                            placeholder="Add a comment..." 
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-20 text-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none shadow-sm transition-all"
                          />
                          <button onClick={() => handlePostComment(ans._id)} className="absolute right-1 top-1 bottom-1 bg-slate-900 text-white hover:bg-indigo-600 font-bold px-3.5 rounded-lg text-xs transition-colors shadow-sm">Post</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {answers.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-200 shadow-sm">
                  <div className="mx-auto w-12 h-12 bg-indigo-50 shadow-sm border border-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <i className="bi bi-lightbulb-fill text-xl text-indigo-500"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">No answers yet</h3>
                  <p className="mt-2 text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">Do you know the answer to this question? Help the community by sharing your knowledge below!</p>
                </div>
              )}
            </div>
          </section>

          {/* Answer Form */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 mt-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><i className="bi bi-pencil-fill text-sm"></i></span> Write Your Answer
            </h2>
            {typingUsers.size > 0 && (
              <div className="text-xs text-indigo-600 mb-3 font-bold flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg inline-flex border border-indigo-100">
                <i className="bi bi-three-dots animate-pulse text-sm leading-none"></i> {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <textarea 
              value={newAnswer} 
              onChange={handleAnswerChange} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all resize-y min-h-[140px] shadow-sm" 
              placeholder="Provide a detailed answer. Markdown formatting is fully supported..."
            ></textarea>
            <div className="mt-4 flex justify-end">
              <button onClick={handlePostAnswer} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg px-6 py-2.5 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 text-sm">
                Post Answer <i className="bi bi-send-fill text-xs"></i>
              </button>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl p-5 sticky top-6">
            <h2 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
               <i className="bi bi-bar-chart-line"></i> Question Stats
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 font-semibold text-sm flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs"><i className="bi bi-arrow-up-right"></i></span> Score</span>
                <strong className="text-base font-bold text-slate-900">{question.upvoteCount - question.downvoteCount}</strong>
              </li>
              <li className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 font-semibold text-sm flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs"><i className="bi bi-eye"></i></span> Views</span>
                <strong className="text-base font-bold text-slate-900">{question.viewCount}</strong>
              </li>
              <li className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 font-semibold text-sm flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center text-xs"><i className="bi bi-chat-dots"></i></span> Answers</span>
                <strong className="text-base font-bold text-slate-900">{answers.length}</strong>
              </li>
              <li className="flex items-center justify-between pt-1 mt-1">
                <span className="text-slate-400 font-medium text-xs">Asked</span>
                <strong className="text-slate-700 text-xs">recently</strong>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
