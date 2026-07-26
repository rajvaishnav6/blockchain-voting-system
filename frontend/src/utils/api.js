/**
 * utils/api.js
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 sec — Render free tier "sleep" se jaagne mein
                  // 30-60 sec lag sakta hai, isliye purana 15s bahut
                  // kam tha!
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
    const requestUrl    = error.config?.url || "";
    const isAuthAttempt = requestUrl.includes("/login") || requestUrl.includes("/register");

    if (error.response?.status === 401 && !isAuthAttempt) {
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
  // Vote karne mein backend ko Sepolia transaction bhi verify
  // karni padti hai — isliye extra time diya (90 sec)
  vote:          (data)  => api.post("/vote", data, { timeout: 90000 }),
  getResults:    ()      => api.get("/getResults"),
  getTransaction: (hash) => api.get(`/transaction/${hash}`),
};

export const adminAPI = {
  // Yeh sab endpoints Sepolia pe ACTUAL blockchain transaction
  // bhejte hain aur uske confirm hone tak wait karte hain
  // (tx.wait()) — isliye 90 sec ka lamba timeout diya
  addCandidate:   (data)  => api.post("/admin/addCandidate", data, { timeout: 90000 }),
  startElection:  ()      => api.post("/admin/startElection", null, { timeout: 90000 }),
  endElection:    ()      => api.post("/admin/endElection", null, { timeout: 90000 }),
  resetElection:  ()      => api.post("/admin/resetElection", null, { timeout: 90000 }),
  getStats:       ()      => api.get("/admin/stats"),
  getVoters:      ()      => api.get("/admin/voters"),
  removeCandidate:(id)    => api.delete(`/admin/candidate/${id}`),
};