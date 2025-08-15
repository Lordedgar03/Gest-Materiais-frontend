import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // sem “/api”
  timeout: 5000,
});

export default publicApi;
