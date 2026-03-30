import axios from "axios";

const API_BASE_URL = "http://localhost:5001/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});
 // gán access token vào header
api.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
});

export default api;
