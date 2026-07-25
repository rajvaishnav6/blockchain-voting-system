/**
 * utils/api.js
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("chainvote_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("chainvote_token");
      localStorage.removeItem("chainvote_user");
      window.location.href = "/login";
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;

export const authAPI = {
  register: (data)  => api.post("/register", data),
  login:    (data)  => api.post("/login", data),
  profile:  ()      => api.get("/profile"),
};

export const voteAPI = {
  getCandidates: ()      => api.get("/getCandidates"),
  vote:          (data)  => api.post("/vote", data),
  getResults:    ()      => api.get("/getResults"),
  getTransaction: (hash) => api.get(`/transaction/${hash}`),
};

export const adminAPI = {
  addCandidate:   (data)  => api.post("/admin/addCandidate", data),
  startElection:  ()      => api.post("/admin/startElection"),
  endElection:    ()      => api.post("/admin/endElection"),
  resetElection:  ()      => api.post("/admin/resetElection"),
  getStats:       ()      => api.get("/admin/stats"),
  getVoters:      ()      => api.get("/admin/voters"),
  removeCandidate:(id)    => api.delete(`/admin/candidate/${id}`),
};