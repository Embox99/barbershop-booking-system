import axios from "axios";

// In dev: Vite proxies /api → localhost:5000/api
// In prod: VITE_API_URL is the full URL (e.g. https://api.mysite.com/api)
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default instance;
