import React, { useState, useEffect } from 'react';
import { MessageCircle, Calendar, School, TrendingUp, Heart, Laugh, ThumbsDown, Send, Image, BarChart3, Lock, Mail, UserCircle, LogOut } from 'lucide-react';
import * as api from './api';

function App() {
  const [currentTab, setCurrentTab] = useState('gossip');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Posts state
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = api.getStoredUser();
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(storedUser);
      setIsLoggedIn(true);
      api.connectSocket();
    }
  }, []);

  // Load posts when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadPosts();
      setupSocketListeners();
    }
  }, [isLoggedIn]);

  const loadPosts = async () => {
    try {
      const postsData = await api.getPosts('gossip');
      setPosts(postsData);
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  };

  const setupSocketListeners = () => {
    const socket = api.getSocket();
    if (!socket) return;

    socket.on('new_post', (post) => {
      setPosts(prev => [post, ...prev]);
    });

    socket.on('post_reaction', ({ postId, reactions }) => {
      setPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, reactions } : p
      ));
    });
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let data;
      if (authMode === 'register') {
        data = await api.register(email, password);
        alert(`🎉 Welcome! Your username is: ${data.user.username}`);
      } else {
        data = await api.login(email, password);
        alert(`✅ Logged in as: ${data.user.username}`);
      }

      setUser(data.user);
      setIsLoggedIn(true);
      setShowAuth(false);
      setEmail('');
      setPassword('');
      api.connectSocket();
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePostGossip = async () => {
    if (!newPost.trim()) return;

    try {
      await api.createPost({
        content: newPost,
        type: 'gossip'
      });
      setNewPost('');
    } catch (err) {
      alert('Failed to post: ' + (err.response?.data?.error || 'Error'));
    }
  };

  const handleReaction = async (postId, type) => {
    try {
      await api.reactToPost(postId, type);
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  // Landing Page
  if (!isLoggedIn && !showAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fb923c, #ec4899, #a855f7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '60px', fontWeight: 'bold', marginBottom: '20px' }}>
            GossipTNClg
          </h1>
          <p style={{ fontSize: '20px', marginBottom: '40px' }}>
            Tamil Nadu's Anonymous College Platform 🎓
          </p>
          <button
            onClick={() => setShowAuth(true)}
            style={{
              background: 'white',
              color: '#ec4899',
              padding: '15px 40px',
              borderRadius: '50px',
              border: 'none',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  // Auth Modal
  if (showAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fb923c, #ec4899, #a855f7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '30px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ textAlign: 'center', fontSize: '30px', marginBottom: '20px' }}>
            GossipTNClg
          </h1>
          
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '16px'
              }}
              disabled={loading}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '16px'
              }}
              disabled={loading}
            />
          </div>
          
          <button
            onClick={handleAuth}
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #fb923c, #ec4899)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Register')}
          </button>
          
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setError('');
              }}
              style={{ color: '#ec4899', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {authMode === 'login' ? 'Register' : 'Login'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div style={{ minHeight: '100vh', background: '#fef3f2' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #fb923c, #ec4899, #a855f7)',
        color: 'white',
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>GossipTNClg</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>{user?.username}</span>
            <button
              onClick={() => {
                api.logout();
                setIsLoggedIn(false);
                setUser(null);
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* Post Input */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share your gossip... (Press Enter to send)"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePostGossip();
              }
            }}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '16px',
              minHeight: '80px',
              marginBottom: '10px'
            }}
          />
          <button
            onClick={handlePostGossip}
            style={{
              background: 'linear-gradient(135deg, #fb923c, #ec4899)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Post Gossip
          </button>
        </div>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px 20px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '20px', color: '#9ca3af', marginBottom: '10px' }}>
              No Messages Yet!
            </h3>
            <p style={{ color: '#9ca3af' }}>Be the first to start the conversation 🔥</p>
          </div>
        ) : (
          <div>
            {posts.map((post) => {
              const isMyMessage = post.username === user?.username;
              return (
                <div
                  key={post._id}
                  style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '20px',
                    marginBottom: '15px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ marginBottom: '10px' }}>
                    <strong>{post.username}</strong>
                    <span style={{
                      marginLeft: '10px',
                      fontSize: '12px',
                      background: '#fce7f3',
                      color: '#ec4899',
                      padding: '4px 8px',
                      borderRadius: '10px'
                    }}>
                      {post.college}
                    </span>
                  </div>
                  
                  <p style={{ marginBottom: '15px', fontSize: '16px' }}>
                    {post.content}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleReaction(post._id, 'like')}
                      style={{
                        background: '#eff6ff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      👍 {post.reactions.like}
                    </button>
                    <button
                      onClick={() => handleReaction(post._id, 'laugh')}
                      style={{
                        background: '#fef3c7',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      😂 {post.reactions.laugh}
                    </button>
                    <button
                      onClick={() => handleReaction(post._id, 'dislike')}
                      style={{
                        background: '#fee2e2',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      👎 {post.reactions.dislike}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;