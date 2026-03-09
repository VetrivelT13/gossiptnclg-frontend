// src/api.js - Frontend API Service
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Socket.io connection
let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(API_URL);
    console.log('🔌 Socket connected');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('❌ Socket disconnected');
  }
};

export const getSocket = () => socket;

// ===== AUTH API =====

export const register = async (email, password, college) => {
  const response = await api.post('/api/auth/register', { email, password, college });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  disconnectSocket();
};

export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// ===== POST API =====

export const getPosts = async (type = null, limit = 50) => {
  const params = type ? { type, limit } : { limit };
  const response = await api.get('/api/posts', { params });
  return response.data;
};

export const createPost = async (postData) => {
  const response = await api.post('/api/posts', postData);
  return response.data;
};

export const reactToPost = async (postId, reactionType) => {
  const response = await api.put(`/api/posts/${postId}/react`, { type: reactionType });
  return response.data;
};

// ===== EVENT API =====

export const getEvents = async () => {
  const response = await api.get('/api/events');
  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await api.post('/api/events', eventData);
  return response.data;
};

export const approveEvent = async (eventId) => {
  const response = await api.put(`/api/events/${eventId}/approve`);
  return response.data;
};

// ===== POLL API =====

export const getPolls = async () => {
  const response = await api.get('/api/polls');
  return response.data;
};

export const createPoll = async (pollData) => {
  const response = await api.post('/api/polls', pollData);
  return response.data;
};

export const votePoll = async (pollId, optionIndex) => {
  const response = await api.put(`/api/polls/${pollId}/vote`, { optionIndex });
  return response.data;
};

// ===== TRENDING API =====

export const getTrending = async () => {
  const response = await api.get('/api/trending');
  return response.data;
};

// ===== ADMIN API =====

export const getAdminStats = async () => {
  const response = await api.get('/api/admin/stats');
  return response.data;
};

export const getPendingEvents = async () => {
  const response = await api.get('/api/admin/pending-events');
  return response.data;
};

export const deleteEvent = async (eventId) => {
  const response = await api.delete(`/api/events/${eventId}`);
  return response.data;
};

export const deletePostAdmin = async (postId) => {
  const response = await api.delete(`/api/admin/posts/${postId}`);
  return response.data;
};

export const reportPost = async (postId, reason) => {
  const response = await api.post(`/api/posts/${postId}/report`, { reason });
  return response.data;
};

export const getReportedPosts = async () => {
  const response = await api.get('/api/admin/reported-posts');
  return response.data;
};

export const banUser = async (userId, reason) => {
  const response = await api.post('/api/admin/ban-user', { userId, reason });
  return response.data;
};

export const clearReport = async (postId) => {
  const response = await api.put(`/api/admin/posts/${postId}/clear-report`);
  return response.data;
};

export default api;