import axios from "axios";
import { getCustomerPortalToken, removeCustomerPortalToken } from "./customerPortalAuth.ts";

const getBaseURL = () =>
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "https://nexus.mbanet.com.pk/api/"
    : "https://nexus.mbanet.com.pk/api/");

const customerPortalAxios = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

customerPortalAxios.interceptors.request.use((config) => {
  const token = getCustomerPortalToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

customerPortalAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeCustomerPortalToken();
    }
    return Promise.reject(error);
  }
);

export default customerPortalAxios;
