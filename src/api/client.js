import axios from "axios";

// One Axios instance for the whole app. Config comes from environment variables.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Example of Bearer-token auth: attach a token if one is stored.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn any Axios error into a readable message.
export function getErrorMessage(error) {
  if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (!error.response) return "Can't reach the server. Check your internet connection.";
  const { status, data } = error.response;
  if (status === 404) return "That employee no longer exists on the server.";
  if (status === 400) return data?.message || "The server rejected the data you sent.";
  if (status >= 500) return "The server had a problem. Try again in a moment.";
  return data?.message || `Request failed (status ${status}).`;
}

export default client;
