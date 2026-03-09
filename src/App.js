import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Calendar, School,
  Send, BarChart3, Lock, Mail, LogOut, Search,
  Plus, Flame, X, Share2, Users
} from 'lucide-react';
import * as api from './api';
import './App.css';

// ===== CONSTANTS =====

const TN_COLLEGES = [
  "Anna University, Chennai",
  "IIT Madras",
  "NIT Trichy",
  "VIT Vellore",
  "SRM Institute of Science and Technology",
  "PSG College of Technology, Coimbatore",
  "Coimbatore Institute of Technology",
  "Thiagarajar College of Engineering, Madurai",
  "SSN College of Engineering, Chennai",
  "Amrita School of Engineering, Coimbatore",
  "SASTRA University, Thanjavur",
  "Madras Institute of Technology, Chennai",
  "Kongu Engineering College, Erode",
  "Government College of Technology, Coimbatore",
  "Kumaraguru College of Technology, Coimbatore",
  "Sri Ramakrishna Engineering College, Coimbatore",
  "Sri Venkateswara College of Engineering, Chennai",
  "Rajalakshmi Engineering College, Chennai",
  "Saveetha Engineering College, Chennai",
  "Easwari Engineering College, Chennai",
  "KCG College of Technology, Chennai",
  "Bannari Amman Institute of Technology, Erode",
  "RVS College of Engineering, Coimbatore",
  "Mepco Schlenk Engineering College, Sivakasi",
  "Kalasalingam Academy of Research & Education",
  "PSNA College of Engineering & Technology",
  "Sethu Institute of Technology, Madurai",
  "Vel Tech University, Chennai",
  "Hindustan University, Chennai",
  "Sathyabama Institute of Science & Technology",
  "GCE Tirunelveli",
  "GCE Salem",
  "GCE Thanjavur",
  "Annamalai University",
  "Bharathidasan University, Tiruchirappalli",
  "Bharathiar University, Coimbatore",
  "Madurai Kamaraj University",
  "University of Madras",
  "Periyar University, Salem",
  "Alagappa University, Karaikudi",
  "Sri Ramachandra Institute of Higher Education",
  "Tamil Nadu Agricultural University, Coimbatore",
  "Loyola College, Chennai",
  "Presidency College, Chennai",
  "Stella Maris College, Chennai",
  "Women's Christian College, Chennai",
  "Bishop Heber College, Tiruchirappalli",
  "Jamal Mohamed College, Tiruchirappalli",
  "Pondicherry University",
  "JIPMER, Pondicherry",
  "Vellore Institute of Technology (VIT Chennai)",
  "PSG Institute of Technology and Applied Research",
  "Amrita College of Engineering, Chennai",
  "SRM Valliammai Engineering College",
  "Jeppiaar Engineering College, Chennai",
  "St. Joseph's College of Engineering, Chennai",
  "Other College"
];

const TABS = [
  { id: 'gossip',      label: 'Gossip',   icon: '💬' },
  { id: 'confessions', label: 'Confess',  icon: '🤫' },
  { id: 'memes',       label: 'Memes',    icon: '😂' },
  { id: 'polls',       label: 'Polls',    icon: '📊' },
  { id: 'colleges',    label: 'Colleges', icon: '🏫' },
  { id: 'events',      label: 'Events',   icon: '📅' },
];

const ADMIN_TABS = [
  ...TABS,
  { id: 'admin', label: 'Admin', icon: '🛡️' },
];

const MAX_CHARS = 500;
const SITE_URL = 'https://gossiptnclg.vercel.app';

// ===== UTILITIES =====

function timeAgo(date) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getTimeLeft(expiresAt) {
  if (!expiresAt) return '';
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return '💨 Gone';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m left`;
}

function shareOnWhatsApp(content, username) {
  const preview = content.length > 150 ? content.slice(0, 150) + '…' : content;
  const text = `🔥 *GossipTNClg — Anonymous College Gossip:*\n\n_"${preview}"_\n\n🤫 See who's talking at: ${SITE_URL}\n_(100% Anonymous — No real names)_`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function getInitials(username) {
  return username ? username.slice(0, 2).toUpperCase() : 'AN';
}

function getAvatarColor(username) {
  const colors = [
    'linear-gradient(135deg, #FF6B6B, #EC4899)',
    'linear-gradient(135deg, #A78BFA, #3B82F6)',
    'linear-gradient(135deg, #10B981, #14B8A6)',
    'linear-gradient(135deg, #F59E0B, #EF4444)',
    'linear-gradient(135deg, #EC4899, #8B5CF6)',
    'linear-gradient(135deg, #3B82F6, #10B981)',
  ];
  const idx = username ? username.charCodeAt(0) % colors.length : 0;
  return colors[idx];
}

// ===== TOAST COMPONENT =====

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast ${type}`} onClick={onClose}>
      {message}
    </div>
  );
}

// ===== POST CARD COMPONENT =====

function PostCard({ post, onReact, onReport, isAdmin, onAdminDelete }) {
  const [reacted, setReacted] = useState(null);
  const [reactions, setReactions] = useState(post.reactions);
  const [bouncing, setBouncing] = useState(null);
  const [reported, setReported] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [burnTimer, setBurnTimer] = useState(post.expiresAt ? getTimeLeft(post.expiresAt) : null);

  // Update confession burn timer every minute
  useEffect(() => {
    if (!post.expiresAt) return;
    const interval = setInterval(() => {
      setBurnTimer(getTimeLeft(post.expiresAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [post.expiresAt]);

  const REPORT_REASONS = [
    'Targeting / harassing a person',
    'Sexual or explicit content',
    'Threatening language',
    'Spreading false rumours',
    'Other violation',
  ];

  const handleReact = async (type) => {
    if (reacted === type) return;
    setBouncing(type);
    setTimeout(() => setBouncing(null), 400);
    const prev = reacted;
    setReacted(type);
    setReactions(r => ({
      ...r,
      [type]: r[type] + 1,
      ...(prev ? { [prev]: r[prev] - 1 } : {})
    }));
    try {
      await onReact(post._id, type);
    } catch {
      setReacted(prev);
      setReactions(post.reactions);
    }
  };

  const typeLabels = { gossip: '💬', meme: '😂', confession: '🤫' };

  const isConfession = post.type === 'confession';

  return (
    <div className={`post-card animate-slideUp ${isConfession ? 'confession-post-card' : ''}`}>
      {/* Confession burn timer banner */}
      {isConfession && burnTimer && (
        <div className="confession-burn-banner">
          🔥 {burnTimer}
        </div>
      )}

      <div className="post-meta">
        <div className="post-avatar" style={{ background: isConfession ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : getAvatarColor(post.username) }}>
          {isConfession ? '🤫' : getInitials(post.username)}
        </div>
        <div className="post-meta-info">
          <div className="post-username">{isConfession ? 'Anonymous' : post.username}</div>
          <div className="post-badges">
            {!isConfession && post.college && (
              <span className="college-badge">🏫 {post.college}</span>
            )}
            <span className="time-badge">{timeAgo(post.timestamp)}</span>
            {post.type && post.type !== 'gossip' && (
              <span className={`post-type-badge post-type-${post.type}`}>
                {typeLabels[post.type]} {post.type}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="post-content">{post.content}</div>

      <div className="post-reactions">
        {[
          { type: 'like',    emoji: '👍' },
          { type: 'laugh',   emoji: '😂' },
          { type: 'dislike', emoji: '👎' },
        ].map(({ type, emoji }) => (
          <button
            key={type}
            className={`reaction-btn ${type} ${reacted === type ? 'active' : ''}`}
            onClick={() => handleReact(type)}
          >
            <span className="reaction-emoji" style={bouncing === type ? { animation: 'bounce 0.4s ease' } : {}}>
              {emoji}
            </span>
            <span>{reactions[type]}</span>
          </button>
        ))}

        {/* WhatsApp Share */}
        <button
          onClick={() => shareOnWhatsApp(post.content, post.username)}
          className="share-wa-btn"
          title="Share on WhatsApp"
        >
          <Share2 size={12} /> Share
        </button>

        {/* Report button */}
        <div style={{ position: 'relative' }}>
          {!reported ? (
            <button
              onClick={() => setShowReportMenu(!showReportMenu)}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: '0.78rem', cursor: 'pointer', padding: '8px 6px',
                display: 'flex', alignItems: 'center', gap: 4
              }}
              title="Report this post"
            >
              🚩 Report
            </button>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--green)', padding: '8px 6px' }}>
              ✅ Reported
            </span>
          )}

          {showReportMenu && (
            <div style={{
              position: 'absolute', right: 0, bottom: '100%', background: 'white',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)', zIndex: 50, minWidth: 220, overflow: 'hidden'
            }}>
              <div style={{ padding: '10px 14px', fontWeight: 700, fontSize: '0.82rem',
                borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                Why are you reporting?
              </div>
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason}
                  onClick={async () => {
                    setShowReportMenu(false);
                    setReported(true);
                    if (onReport) await onReport(post._id, reason);
                  }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', background: 'none', border: 'none',
                    fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.target.style.background = '#fef2f2'}
                  onMouseLeave={e => e.target.style.background = 'none'}
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Admin delete button */}
        {isAdmin && (
          <button
            onClick={() => onAdminDelete && onAdminDelete(post._id)}
            style={{
              background: '#fef2f2', border: '1.5px solid #fecaca', color: '#ef4444',
              padding: '6px 12px', borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
            }}
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ===== POLL CARD COMPONENT =====

function PollCard({ poll, onVote }) {
  const totalVotes = poll.votes.reduce((a, b) => a + b, 0);

  return (
    <div className="poll-card">
      <div className="post-meta" style={{ marginBottom: '14px' }}>
        <div className="post-avatar" style={{ background: getAvatarColor(poll.username) }}>
          {getInitials(poll.username)}
        </div>
        <div className="post-meta-info">
          <div className="post-username">{poll.username}</div>
          <div className="post-badges">
            <span className="time-badge">{timeAgo(poll.timestamp)}</span>
            <span className="post-type-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              📊 poll
            </span>
          </div>
        </div>
      </div>

      <div className="poll-question">{poll.question}</div>

      <div>
        {poll.options.map((option, idx) => {
          const pct = totalVotes > 0 ? Math.round((poll.votes[idx] / totalVotes) * 100) : 0;
          return (
            <button
              key={idx}
              className="poll-option"
              onClick={() => onVote(poll._id, idx)}
            >
              <div
                className="poll-option-fill"
                style={{ width: `${pct}%` }}
              />
              <span className="poll-option-text">{option}</span>
              <span className="poll-option-pct">
                {poll.votes[idx]} <span style={{ opacity: 0.6 }}>({pct}%)</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="poll-footer">
        <span>🗳️ {totalVotes} total votes</span>
        {poll.expiresAt && (
          <span>Ends {timeAgo(poll.expiresAt)}</span>
        )}
      </div>
    </div>
  );
}

// ===== MAIN APP COMPONENT =====

function App() {
  // ---- State ----
  const [currentTab, setCurrentTab] = useState('gossip');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Auth form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');

  // Data
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [polls, setPolls] = useState([]);
  const [memes, setMemes] = useState([]);
  const [confessions, setConfessions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [liveCount, setLiveCount] = useState(0);

  // Composers
  const [newPost, setNewPost] = useState('');
  const [newMeme, setNewMeme] = useState('');
  const [newConfession, setNewConfession] = useState('');
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '' });
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });

  // College search
  const [collegeSearch, setCollegeSearch] = useState('');

  // Admin state
  const [adminStats, setAdminStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [reportedPosts, setReportedPosts] = useState([]);

  const postTextRef = useRef(null);

  // ---- Effects ----

  useEffect(() => {
    const storedUser = api.getStoredUser();
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(storedUser);
      setIsLoggedIn(true);
      api.connectSocket();
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      setupSocketListeners();
    }
    // eslint-disable-next-line
  }, [isLoggedIn, currentTab]);

  // ---- Data Loading ----

  const loadData = async () => {
    try {
      if (currentTab === 'gossip') {
        const [postsData, trendData] = await Promise.all([
          api.getPosts('gossip'),
          api.getTrending().catch(() => [])
        ]);
        setPosts(postsData);
        setTrending(trendData.slice(0, 5));
      } else if (currentTab === 'confessions') {
        const confData = await api.getPosts('confession');
        setConfessions(confData);
      } else if (currentTab === 'memes') {
        const memesData = await api.getPosts('meme');
        setMemes(memesData);
      } else if (currentTab === 'events') {
        const eventsData = await api.getEvents();
        setEvents(eventsData);
      } else if (currentTab === 'polls') {
        const pollsData = await api.getPolls();
        setPolls(pollsData);
      } else if (currentTab === 'colleges') {
        const postsData = await api.getPosts();
        setPosts(postsData);
      } else if (currentTab === 'admin') {
        const [stats, pending, reported] = await Promise.all([
          api.getAdminStats(),
          api.getPendingEvents(),
          api.getReportedPosts()
        ]);
        setAdminStats(stats);
        setPendingEvents(pending);
        setReportedPosts(reported);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const setupSocketListeners = () => {
    const socket = api.getSocket();
    if (!socket) return;

    socket.off('new_post');
    socket.off('post_reaction');
    socket.off('new_event');
    socket.off('new_poll');
    socket.off('poll_update');
    socket.off('reader_count');

    socket.on('reader_count', (count) => setLiveCount(count));

    socket.on('new_post', (post) => {
      if (post.type === 'gossip') setPosts(prev => [post, ...prev]);
      else if (post.type === 'meme') setMemes(prev => [post, ...prev]);
      else if (post.type === 'confession') setConfessions(prev => [post, ...prev]);
    });

    socket.on('post_reaction', ({ postId, reactions }) => {
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, reactions } : p));
      setMemes(prev => prev.map(m => m._id === postId ? { ...m, reactions } : m));
    });

    socket.on('new_event', (event) => setEvents(prev => [event, ...prev]));
    socket.on('new_poll', (poll) => setPolls(prev => [poll, ...prev]));
    socket.on('poll_update', (updated) => setPolls(prev => prev.map(p => p._id === updated._id ? updated : p)));
  };

  // ---- Toast ----

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // ---- Auth ----

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    if (authMode === 'register' && !college) {
      setError('Please select your college');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let data;
      if (authMode === 'register') {
        data = await api.register(email, password, college);
        showToast(`🎉 Welcome ${data.user.username}! You're anonymous.`, 'success');
      } else {
        data = await api.login(email, password);
        showToast(`✅ Welcome back, ${data.user.username}!`, 'success');
      }
      setUser(data.user);
      setIsLoggedIn(true);
      setShowAuth(false);
      setEmail('');
      setPassword('');
      setCollege('');
      api.connectSocket();
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setUser(null);
    setPosts([]);
    setMemes([]);
    setEvents([]);
    setPolls([]);
  };

  // ---- Post Handlers ----

  const handlePostGossip = async () => {
    if (!newPost.trim() || newPost.length > MAX_CHARS) return;
    try {
      await api.createPost({ content: newPost, type: 'gossip' });
      setNewPost('');
      showToast('📢 Gossip posted anonymously!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to post', 'error');
    }
  };

  const handlePostConfession = async () => {
    if (!newConfession.trim() || newConfession.length > MAX_CHARS) return;
    const lower = newConfession.toLowerCase();
    const sensitive = ['kill', 'suicide', 'die', 'harm'].some(w => lower.includes(w));
    if (sensitive) {
      if (!window.confirm('⚠️ Your confession may contain sensitive content.\n\nIf you need help: iCall 9152987821\n\nContinue?')) return;
    }
    try {
      await api.createPost({ content: newConfession, type: 'confession' });
      setNewConfession('');
      showToast('🤫 Confession posted! It burns in 24 hours.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to post', 'error');
    }
  };

  const handleInvite = () => {
    const msg = `🔥 Yoo! Check out *GossipTNClg* — Tamil Nadu's Anonymous College Platform!\n\n🤫 Post gossip, confessions, memes & polls — 100% anonymous, no one knows who you are!\n\n📱 Join for free: ${SITE_URL}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePostMeme = async () => {
    if (!newMeme.trim()) return;
    try {
      await api.createPost({ content: newMeme, type: 'meme' });
      setNewMeme('');
      showToast('😂 Meme posted!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to post', 'error');
    }
  };

  const handlePostEvent = async () => {
    if (!newEvent.title.trim()) {
      showToast('Please enter event title', 'error');
      return;
    }
    try {
      await api.createEvent(newEvent);
      setNewEvent({ title: '', description: '', date: '' });
      showToast('📅 Event posted! It\'s now live for everyone to see.');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create event', 'error');
    }
  };

  const handleCreatePoll = async () => {
    if (!newPoll.question.trim()) {
      showToast('Please enter a poll question', 'error');
      return;
    }
    const validOptions = newPoll.options.filter(o => o.trim());
    if (validOptions.length < 2) {
      showToast('Add at least 2 options', 'error');
      return;
    }
    try {
      await api.createPoll({ question: newPoll.question, options: validOptions });
      setNewPoll({ question: '', options: ['', ''] });
      showToast('📊 Poll created!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create poll', 'error');
    }
  };

  const handleVotePoll = async (pollId, optionIndex) => {
    try {
      await api.votePoll(pollId, optionIndex);
      showToast('🗳️ Vote recorded!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to vote', 'error');
    }
  };

  const handleReport = async (postId, reason) => {
    try {
      await api.reportPost(postId, reason);
      showToast('🚩 Reported. Our admin will review this post within 24 hours.', 'info');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to report', 'error');
    }
  };

  const handleReaction = async (postId, type) => {
    try {
      await api.reactToPost(postId, type);
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      await api.approveEvent(eventId);
      setPendingEvents(prev => prev.filter(e => e._id !== eventId));
      setEvents(prev => prev.map(e => e._id === eventId ? { ...e, approved: true } : e));
      if (adminStats) setAdminStats(s => ({ ...s, pendingEvents: s.pendingEvents - 1 }));
      showToast('✅ Event approved and live!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to approve', 'error');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event permanently?')) return;
    try {
      await api.deleteEvent(eventId);
      setPendingEvents(prev => prev.filter(e => e._id !== eventId));
      setEvents(prev => prev.filter(e => e._id !== eventId));
      showToast('🗑️ Event deleted');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await api.deletePostAdmin(postId);
      setPosts(prev => prev.filter(p => p._id !== postId));
      setMemes(prev => prev.filter(p => p._id !== postId));
      showToast('🗑️ Post deleted');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete', 'error');
    }
  };

  // ---- RENDER: LANDING ----

  if (!isLoggedIn && !showAuth) {
    return (
      <div className="landing">
        {/* Floating emoji background */}
        <div className="landing-emojis">
          {['💬','🔥','😂','🎓','🏫','⚡','📢','💡'].map((e, i) => (
            <span
              key={i}
              className="landing-emoji"
              style={{
                left: `${10 + i * 12}%`,
                top: `${15 + (i % 3) * 25}%`,
                animationDelay: `${-i * 0.7}s`
              }}
            >
              {e}
            </span>
          ))}
        </div>

        <div className="landing-content">
          <div className="landing-logo">
            <span>G</span><span>o</span><span>s</span><span>s</span><span>i</span><span>p</span>
            &nbsp;TNClg 🔥
          </div>
          <p className="landing-tagline">Tamil Nadu's #1 Anonymous College Platform 🎓</p>
          <p className="landing-sub">No real names. No judgement. Just real campus life.</p>

          <div className="landing-stats">
            <div className="landing-stat">
              <div className="landing-stat-num">50+</div>
              <div className="landing-stat-label">Colleges</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-num">100%</div>
              <div className="landing-stat-label">Anonymous</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-num">Live</div>
              <div className="landing-stat-label">Real-time</div>
            </div>
          </div>

          <button className="landing-cta" onClick={() => setShowAuth(true)}>
            Join Now — It's Free 🚀
          </button>

          <div className="landing-features">
            {['💬 Gossip', '🤫 Confess', '😂 Memes', '📊 Polls', '📅 Events', '🏫 Colleges'].map(f => (
              <span key={f} className="landing-feature">{f}</span>
            ))}
          </div>

          <div className="landing-confession-hook">
            🤫 Confessions burn in 24 hours. No name. No trace. Ever.
          </div>

          <button className="landing-invite-btn" onClick={() => {
            const msg = `🔥 Yoo! Check out *GossipTNClg* — Tamil Nadu's Anonymous College Platform!\n\n🤫 Post gossip, confessions, memes & polls — 100% anonymous!\n\n📱 Join free: ${SITE_URL}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          }}>
            📲 Share to WhatsApp Group
          </button>
        </div>
      </div>
    );
  }

  // ---- RENDER: AUTH ----

  if (showAuth) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">GossipTNClg 🔥</div>
            <div className="auth-subtitle">Tamil Nadu's Anonymous College Platform</div>
          </div>

          <div className="auth-tabs">
            {['login', 'register'].map(m => (
              <button
                key={m}
                className={`auth-tab ${authMode === m ? 'active' : ''}`}
                onClick={() => { setAuthMode(m); setError(''); }}
              >
                {m === 'login' ? '🔑 Login' : '🎓 Register'}
              </button>
            ))}
          </div>

          {error && (
            <div className="auth-error">
              <X size={16} /> {error}
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-icon">
              <Mail size={16} className="icon" />
              <input
                className="auth-input"
                type="email"
                placeholder="your@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-icon">
              <Lock size={16} className="icon" />
              <input
                className="auth-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                disabled={loading}
              />
            </div>
          </div>

          {authMode === 'register' && (
            <div className="auth-field">
              <label className="auth-label">Your College</label>
              <div className="auth-input-icon" style={{ position: 'relative' }}>
                <School size={16} className="icon" />
                <select
                  className="auth-select"
                  style={{ paddingLeft: '44px' }}
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select your college…</option>
                  {TN_COLLEGES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            className="auth-btn"
            onClick={handleAuth}
            disabled={loading}
          >
            {loading
              ? '⏳ Please wait…'
              : authMode === 'login' ? '🔑 Login' : '🎓 Create Account'}
          </button>

          {authMode === 'register' && (
            <div className="auth-anon-note">
              <Lock size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                You'll get a <strong>random anonymous username</strong> — your real identity is never shown.
                Your email is only used for login.
              </span>
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {authMode === 'login' ? "New here? " : "Already have an account? "}
            <span
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
            >
              {authMode === 'login' ? 'Create account →' : '← Back to login'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ---- RENDER: MAIN APP ----

  // Colleges tab: always show full TN_COLLEGES list, filter by search
  const filteredCollegeList = collegeSearch
    ? TN_COLLEGES.filter(c => c.toLowerCase().includes(collegeSearch.toLowerCase()))
    : TN_COLLEGES;

  // Posts from colleges that match search (for showing posts below the grid)
  const filteredCollegeResults = collegeSearch
    ? posts.filter(p => p.college?.toLowerCase().includes(collegeSearch.toLowerCase()))
    : [];

  const charCount = newPost.length;
  const charClass = charCount > MAX_CHARS ? 'danger' : charCount > MAX_CHARS * 0.8 ? 'warning' : '';

  return (
    <div className="app">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="header-logo-icon">🔥</span>
            <span className="logo-full">GossipTNClg</span>
            <span className="logo-short">TNClg</span>
          </div>
          <div className="header-right">
            {liveCount > 0 && (
              <div className="live-count-badge">
                <span className="live-dot" />
                <Users size={11} />
                <span>{liveCount}</span>
              </div>
            )}
            <button className="invite-btn" onClick={handleInvite} title="Invite Friends on WhatsApp">
              📲 Invite
            </button>
            <div className="header-user-chip">
              <div className="header-avatar" style={{ background: getAvatarColor(user?.username) }}>
                {getInitials(user?.username)}
              </div>
              <div>
                <div style={{ lineHeight: 1 }}>{user?.username}</div>
                {user?.college && (
                  <div className="header-college-badge">🏫 {user.college}</div>
                )}
              </div>
            </div>
            <button className="header-logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ===== DESKTOP TAB NAV ===== */}
      <nav className="tab-nav">
        <div className="tab-nav-inner">
          {(user?.role === 'admin' ? ADMIN_TABS : TABS).map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${currentTab === tab.id ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab.id)}
              style={tab.id === 'admin' ? { color: '#8b5cf6' } : {}}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
              {tab.id === 'admin' && adminStats?.pendingEvents > 0 && (
                <span style={{
                  background: '#ef4444', color: 'white', borderRadius: '9999px',
                  fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', marginLeft: 4
                }}>
                  {adminStats.pendingEvents}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ===== MENTAL HEALTH BANNER ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed, #db2777)',
        color: 'white', padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, fontSize: '0.82rem', flexWrap: 'wrap', textAlign: 'center'
      }}>
        <span>💙 If you or someone you know needs help:</span>
        <span style={{ fontWeight: 700 }}>iCall: 9152987821</span>
        <span>·</span>
        <span style={{ fontWeight: 700 }}>Vandrevala: 1860-2662-345</span>
        <span>·</span>
        <span style={{ fontWeight: 700 }}>Snehi: 044-24640050</span>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="content">

        {/* ====== GOSSIP TAB ====== */}
        {currentTab === 'gossip' && (
          <>
            {/* Trending Strip */}
            {trending.length > 0 && (
              <div className="trending-strip">
                <div className="trending-title">
                  <Flame size={14} style={{ color: 'var(--primary)' }} />
                  Trending Now
                </div>
                <div className="trending-items">
                  {trending.map((t, i) => (
                    <div key={i} className="trending-item">
                      <span className="trending-fire">🔥</span>
                      <span>{t.content.slice(0, 30)}{t.content.length > 30 ? '…' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Composer */}
            <div className="composer">
              <div className="composer-header">
                <div className="composer-avatar" style={{ background: getAvatarColor(user?.username) }}>
                  {getInitials(user?.username)}
                </div>
                <div className="composer-who">
                  <strong>{user?.username}</strong>
                  <span>Anonymous · {user?.college || 'Unknown College'}</span>
                </div>
              </div>
              <textarea
                ref={postTextRef}
                className="composer-textarea"
                placeholder="What's the campus gossip today? 🤫 (You're anonymous)"
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                maxLength={MAX_CHARS + 50}
                rows={3}
              />
              <div className="composer-footer">
                <span className={`composer-char-count ${charClass}`}>
                  {MAX_CHARS - charCount} left
                </span>
                <span className="composer-anon-badge">
                  <Lock size={11} /> Anonymous
                </span>
                <button
                  className="composer-submit"
                  onClick={() => {
                    const lower = newPost.toLowerCase();
                    const sensitive = ['kill','suicide','die','harm'].some(w => lower.includes(w));
                    if (sensitive) {
                      if (!window.confirm('⚠️ Your post may contain sensitive content.\n\nReminder: Do not target or harm anyone.\nIf you need help: iCall 9152987821\n\nContinue posting?')) return;
                    }
                    handlePostGossip();
                  }}
                  disabled={!newPost.trim() || charCount > MAX_CHARS}
                >
                  <Send size={14} /> Post
                </button>
              </div>
            </div>

            {/* Feed */}
            <div className="section-header">
              <span className="section-title">
                💬 Campus Feed
              </span>
              <span className="section-count">{posts.length} posts</span>
            </div>

            {posts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📢</span>
                <div className="empty-state-title">No gossip yet!</div>
                <div className="empty-state-sub">Be the first to spill the tea ☕</div>
              </div>
            ) : (
              posts.map((post, i) => (
                <div key={post._id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <PostCard post={post} onReact={handleReaction} onReport={handleReport} isAdmin={user?.role === 'admin'} onAdminDelete={handleDeletePost} />
                </div>
              ))
            )}
          </>
        )}

        {/* ====== CONFESSIONS TAB ====== */}
        {currentTab === 'confessions' && (
          <>
            {/* Confessions intro banner */}
            <div className="confessions-banner">
              <div className="confessions-banner-title">🤫 Anonymous Confessions</div>
              <div className="confessions-banner-sub">
                Your deepest campus secrets — gone in 24 hours. No name. No trace. Ever.
              </div>
            </div>

            {/* Confession composer */}
            <div className="composer confession-composer">
              <div className="composer-header">
                <div className="composer-avatar" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  🤫
                </div>
                <div className="composer-who">
                  <strong>Anonymous</strong>
                  <span>🔥 Burns in 24 hours · No one knows it's you</span>
                </div>
              </div>
              <textarea
                className="composer-textarea confession-textarea"
                placeholder="I have a confession… (completely anonymous, deletes in 24h)"
                value={newConfession}
                onChange={e => setNewConfession(e.target.value)}
                maxLength={MAX_CHARS + 50}
                rows={3}
              />
              <div className="composer-footer">
                <span className={`composer-char-count ${newConfession.length > MAX_CHARS ? 'danger' : newConfession.length > MAX_CHARS * 0.8 ? 'warning' : ''}`}>
                  {MAX_CHARS - newConfession.length} left
                </span>
                <span className="confession-burn-label">🔥 Burns in 24h</span>
                <button
                  className="composer-submit confession-submit"
                  onClick={handlePostConfession}
                  disabled={!newConfession.trim() || newConfession.length > MAX_CHARS}
                >
                  <Lock size={13} /> Confess
                </button>
              </div>
            </div>

            <div className="section-header">
              <span className="section-title">🤫 Live Confessions</span>
              <span className="section-count">{confessions.length} confessions</span>
            </div>

            {confessions.length === 0 ? (
              <div className="empty-state confession-empty">
                <span className="empty-state-icon">🤫</span>
                <div className="empty-state-title">No confessions yet</div>
                <div className="empty-state-sub">Be the first to confess something… it disappears in 24h 🔥</div>
              </div>
            ) : (
              confessions.map((post, i) => (
                <div key={post._id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <PostCard
                    post={post}
                    onReact={handleReaction}
                    onReport={handleReport}
                    isAdmin={user?.role === 'admin'}
                    onAdminDelete={handleDeletePost}
                  />
                </div>
              ))
            )}
          </>
        )}

        {/* ====== MEMES TAB ====== */}
        {currentTab === 'memes' && (
          <>
            <div className="form-card">
              <div className="form-card-title">😂 Share College Memes</div>
              <textarea
                className="form-textarea"
                placeholder="Drop a meme, funny moment, or college joke…"
                value={newMeme}
                onChange={e => setNewMeme(e.target.value)}
                rows={3}
              />
              <div className="form-btn-row">
                <button className="btn btn-yellow" onClick={handlePostMeme} disabled={!newMeme.trim()}>
                  <Send size={14} /> Post Meme
                </button>
              </div>
            </div>

            <div className="section-header">
              <span className="section-title">😂 Meme Feed</span>
              <span className="section-count">{memes.length} memes</span>
            </div>

            {memes.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">😂</span>
                <div className="empty-state-title">No memes yet!</div>
                <div className="empty-state-sub">Share the first college meme 🎓</div>
              </div>
            ) : (
              memes.map((meme, i) => (
                <div key={meme._id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <PostCard post={meme} onReact={handleReaction} onReport={handleReport} isAdmin={user?.role === 'admin'} onAdminDelete={handleDeletePost} />
                </div>
              ))
            )}
          </>
        )}

        {/* ====== EVENTS TAB ====== */}
        {currentTab === 'events' && (
          <>
            <div className="form-card">
              <div className="form-card-title">📅 Submit College Event</div>
              <input
                className="form-input"
                type="text"
                placeholder="Event Title (e.g. Tech Fest 2025)"
                value={newEvent.title}
                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <textarea
                className="form-textarea"
                placeholder="Event Description…"
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                rows={3}
              />
              <input
                className="form-input"
                type="date"
                value={newEvent.date}
                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                style={{ marginBottom: 0 }}
              />
              <div className="form-btn-row" style={{ marginTop: '12px' }}>
                <button className="btn btn-purple" onClick={handlePostEvent}>
                  <Plus size={14} /> Submit Event
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--green)', marginTop: '10px', fontWeight: 600 }}>
                ✅ Events go live instantly — no approval needed!
              </p>
            </div>

            <div className="section-header">
              <span className="section-title">📅 College Events</span>
              <span className="section-count">{events.length} events</span>
            </div>

            {events.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📅</span>
                <div className="empty-state-title">No events yet!</div>
                <div className="empty-state-sub">Submit your college event above 🎉</div>
              </div>
            ) : (
              events.map((event, i) => (
                <div
                  key={event._id}
                  className="event-card"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="event-card-header">
                    <div className="event-title">{event.title}</div>
                    <span className={`event-status ${event.approved ? 'approved' : 'pending'}`}>
                      {event.approved ? '✅ Live' : '⏳ Pending'}
                    </span>
                  </div>
                  {event.description && (
                    <div className="event-desc">{event.description}</div>
                  )}
                  <div className="event-footer">
                    {event.date && (
                      <span className="event-date">
                        <Calendar size={13} />
                        {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    <span className="event-by">by {event.username}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ====== POLLS TAB ====== */}
        {currentTab === 'polls' && (
          <>
            <div className="form-card">
              <div className="form-card-title">📊 Create Anonymous Poll</div>
              <input
                className="form-input"
                type="text"
                placeholder="Poll Question (e.g. Best canteen in TN?)"
                value={newPoll.question}
                onChange={e => setNewPoll({ ...newPoll, question: e.target.value })}
              />
              {newPoll.options.map((opt, idx) => (
                <input
                  key={idx}
                  className="form-input"
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={e => {
                    const opts = [...newPoll.options];
                    opts[idx] = e.target.value;
                    setNewPoll({ ...newPoll, options: opts });
                  }}
                />
              ))}
              <div className="form-btn-row">
                <button
                  className="btn btn-ghost"
                  onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })}
                  disabled={newPoll.options.length >= 6}
                >
                  <Plus size={14} /> Add Option
                </button>
                <button className="btn btn-green" onClick={handleCreatePoll}>
                  <BarChart3 size={14} /> Create Poll
                </button>
              </div>
            </div>

            <div className="section-header">
              <span className="section-title">📊 Active Polls</span>
              <span className="section-count">{polls.length} polls</span>
            </div>

            {polls.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📊</span>
                <div className="empty-state-title">No polls yet!</div>
                <div className="empty-state-sub">Create the first poll above 🗳️</div>
              </div>
            ) : (
              polls.map((poll, i) => (
                <div key={poll._id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <PollCard poll={poll} onVote={handleVotePoll} />
                </div>
              ))
            )}
          </>
        )}

        {/* ====== COLLEGES TAB ====== */}
        {currentTab === 'colleges' && (
          <>
            {/* College Leaderboard */}
            {(() => {
              const leaderboard = TN_COLLEGES
                .map(clg => ({ name: clg, count: posts.filter(p => p.college === clg).length }))
                .filter(c => c.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
              return leaderboard.length > 0 ? (
                <div className="leaderboard-card">
                  <div className="leaderboard-title">🏆 Most Active Colleges</div>
                  {leaderboard.map((item, idx) => (
                    <div key={idx} className="leaderboard-row" onClick={() => setCollegeSearch(item.name.split(',')[0])}>
                      <span className="leaderboard-rank">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </span>
                      <span className="leaderboard-name">{item.name}</span>
                      <span className="leaderboard-count">{item.count} posts 🔥</span>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

            <div className="college-search-bar">
              <div className="college-search-wrap">
                <Search size={16} className="college-search-icon" />
                <input
                  className="college-search-input"
                  type="text"
                  placeholder="Search college… (e.g. Anna, VIT, SRM)"
                  value={collegeSearch}
                  onChange={e => setCollegeSearch(e.target.value)}
                />
              </div>
              {collegeSearch && (
                <button
                  onClick={() => setCollegeSearch('')}
                  style={{
                    marginTop: '10px', padding: '6px 14px',
                    background: 'var(--border)', color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600
                  }}
                >
                  <X size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Clear
                </button>
              )}
            </div>

            <div className="section-header" style={{ marginBottom: '12px' }}>
              <span className="section-title">
                {collegeSearch ? `Results for "${collegeSearch}"` : '🏫 All TN Colleges'}
              </span>
              <span className="section-count">
                {filteredCollegeList.length} college{filteredCollegeList.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredCollegeList.length === 0 && (
              <div className="empty-state">
                <span className="empty-state-icon">🔍</span>
                <div className="empty-state-title">No match for "{collegeSearch}"</div>
                <div className="empty-state-sub">Try searching a shorter name (e.g. "Anna", "VIT", "SRM")</div>
              </div>
            )}

            <div className="college-grid">
              {filteredCollegeList.map((clg, idx) => {
                const clgPosts = posts.filter(p => p.college === clg);
                const hasActivity = clgPosts.length > 0;
                return (
                  <div
                    key={idx}
                    className="college-card animate-slideUp"
                    style={{ animationDelay: `${Math.min(idx * 0.03, 0.5)}s` }}
                    onClick={() => setCollegeSearch(clg.split(',')[0])}
                  >
                    <div className="college-card-icon">{hasActivity ? '🔥' : '🏫'}</div>
                    <div className="college-card-name">{clg}</div>
                    <div className="college-card-count">
                      <MessageCircle size={11} />
                      {hasActivity ? `${clgPosts.length} post${clgPosts.length !== 1 ? 's' : ''}` : 'No posts yet'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Posts from searched college */}
            {collegeSearch && filteredCollegeResults.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div className="section-header">
                  <span className="section-title">Posts from these colleges</span>
                  <span className="section-count">{filteredCollegeResults.length}</span>
                </div>
                {filteredCollegeResults.map((post, i) => (
                  <div key={post._id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <PostCard post={post} onReact={handleReaction} onReport={handleReport} isAdmin={user?.role === 'admin'} onAdminDelete={handleDeletePost} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ====== ADMIN TAB ====== */}
        {currentTab === 'admin' && user?.role === 'admin' && (
          <>
            {/* Stats Cards */}
            {adminStats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total Users',   value: adminStats.totalUsers,    icon: '👥', color: '#3b82f6' },
                  { label: 'Total Posts',   value: adminStats.totalPosts,    icon: '💬', color: '#ec4899' },
                  { label: 'Total Events',  value: adminStats.totalEvents,   icon: '📅', color: '#8b5cf6' },
                  { label: 'Pending Events',value: adminStats.pendingEvents, icon: '⏳', color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'white', borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                    boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Events */}
            <div className="section-header">
              <span className="section-title">⏳ Pending Events</span>
              <span className="section-count">{pendingEvents.length} pending</span>
            </div>

            {pendingEvents.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">✅</span>
                <div className="empty-state-title">All caught up!</div>
                <div className="empty-state-sub">No pending events to review</div>
              </div>
            ) : (
              pendingEvents.map(event => (
                <div key={event._id} style={{
                  background: 'white', borderRadius: 'var(--radius-lg)', padding: 20,
                  marginBottom: 12, boxShadow: 'var(--shadow-card)',
                  border: '2px solid #fef3c7'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{event.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>by {event.username} · {timeAgo(event.timestamp)}</div>
                    </div>
                    <span style={{ background: '#fef3c7', color: '#854d0e', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)', flexShrink: 0 }}>
                      ⏳ PENDING
                    </span>
                  </div>
                  {event.description && (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{event.description}</div>
                  )}
                  {event.date && (
                    <div style={{ fontSize: '0.82rem', color: '#8b5cf6', fontWeight: 600, marginBottom: 14 }}>
                      📅 {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-green" onClick={() => handleApproveEvent(event._id)} style={{ flex: 1 }}>
                      ✅ Approve & Publish
                    </button>
                    <button className="btn btn-ghost" onClick={() => handleDeleteEvent(event._id)}
                      style={{ color: '#ef4444', borderColor: '#ef4444', flexShrink: 0 }}>
                      🗑️ Reject
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Reported Posts */}
            <div className="section-header" style={{ marginTop: 24 }}>
              <span className="section-title">🚩 Reported Posts</span>
              <span className="section-count" style={{ background: reportedPosts.length > 0 ? '#fef2f2' : '', color: reportedPosts.length > 0 ? '#ef4444' : '' }}>
                {reportedPosts.length} reported
              </span>
            </div>

            {reportedPosts.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <span className="empty-state-icon" style={{ fontSize: '2rem' }}>✅</span>
                <div className="empty-state-title">No reported posts</div>
                <div className="empty-state-sub">Community is safe!</div>
              </div>
            ) : (
              reportedPosts.map(post => (
                <div key={post._id} style={{
                  background: 'white', borderRadius: 'var(--radius-lg)', padding: 16,
                  marginBottom: 12, border: '2px solid #fecaca', boxShadow: 'var(--shadow-card)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{post.username}</span>
                    <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                      🚩 {post.reportCount} report{post.reportCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                    {post.content}
                  </p>
                  {post.reportReasons?.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                      Reasons: {post.reportReasons.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" style={{ background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', flex: 1, padding: '8px' }}
                      onClick={async () => {
                        await api.deletePostAdmin(post._id);
                        setReportedPosts(prev => prev.filter(p => p._id !== post._id));
                        showToast('🗑️ Post deleted');
                      }}>
                      🗑️ Delete Post
                    </button>
                    <button className="btn btn-ghost" style={{ flex: 1, padding: '8px', fontSize: '0.82rem' }}
                      onClick={async () => {
                        await api.clearReport(post._id);
                        setReportedPosts(prev => prev.filter(p => p._id !== post._id));
                        showToast('✅ Report cleared — post is safe');
                      }}>
                      ✅ Mark Safe
                    </button>
                    <button className="btn" style={{ background: '#7c3aed', color: 'white', padding: '8px 12px', fontSize: '0.78rem' }}
                      onClick={async () => {
                        const reason = window.prompt('Ban reason:') || 'Community guidelines violation';
                        await api.banUser(post.userId, reason);
                        setReportedPosts(prev => prev.filter(p => p._id !== post._id));
                        showToast('🚫 User banned and posts removed');
                      }}>
                      🚫 Ban User
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

      </main>

      {/* ===== INSTAGRAM FAB ===== */}
      <a
        href="https://www.instagram.com/gossiptnclg_?igsh=MWVlZ3o2b3lrc3NvbQ=="
        target="_blank"
        rel="noopener noreferrer"
        className="insta-fab"
        title="Follow us on Instagram"
      >
        📸
      </a>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-name">
          Created by <strong>Vetrivel T</strong>
        </div>
        <div className="footer-role">
          🔐 Cyber Security Specialist
        </div>
        <div className="footer-copy">
          GossipTNClg © 2025 · Tamil Nadu's Premier Anonymous College Platform
        </div>
      </footer>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {(user?.role === 'admin' ? ADMIN_TABS : TABS).map(tab => (
            <button
              key={tab.id}
              className={`mobile-nav-btn ${currentTab === tab.id ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;
