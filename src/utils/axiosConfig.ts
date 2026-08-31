// src/utils/axiosConfig.ts
import axios from "axios";
import { formatApiError, toast } from "./notify.ts";
import { removeToken, getToken, getRefreshToken } from "./auth.ts";
import { LOGIN_ROUTE } from "./authRedirects.ts";

// Environment-based configuration
const getBaseURL = () => {
  return process.env.REACT_APP_API_BASE_URL ||
    (process.env.NODE_ENV === "development"
      ? "https://nexus.mbanet.com.pk/api/"  // Development URL
      : "https://nexus.mbanet.com.pk/api/"                       // Production: Relative path
    );
};

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple simultaneous token refresh requests
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Browser address-bar host (vendor domains). Needed when API lives on a
    // different host (e.g. nexus.mbanet.com.pk) so login/host allowlist can
    // resolve the real site. Prefer X-Forwarded-Host when nginx same-origin.
    if (typeof window !== "undefined" && window.location?.hostname) {
      config.headers["X-Site-Host"] = window.location.hostname;
    }

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (typeof config.headers?.delete === "function") {
        config.headers.delete("Content-Type");
        config.headers.delete("content-type");
      } else if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    // Add timestamp to prevent caching for GET requests
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // You can add response transformation here if needed
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const reqUrl = String(originalRequest?.url || "")
      // Failed login/refresh must not trigger "Session expired" redirect noise
      if (reqUrl.includes("/auth/login") || reqUrl.includes("auth/login")) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        // No refresh token available, redirect to login
        handleUnauthorized();
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh the token
        const response = await axios.post(`${getBaseURL()}auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;

        // Store new tokens (you'll need to implement setToken and setRefreshToken)
        // setToken(access_token);
        // setRefreshToken(refresh_token);

        // Update Authorization header
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Process queued requests
        processQueue(null, access_token);
        isRefreshing = false;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        processQueue(refreshError, null);
        handleUnauthorized();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    if (!originalRequest?.skipErrorToast) {
      handleError(error)
    }
    return Promise.reject(error);
  }
);

// Helper function for unauthorized handling
const handleUnauthorized = () => {
  toast.error("Session expired. Redirecting to sign in…");
  removeToken();
  // Delay redirect to allow toast to be visible
  setTimeout(() => {
    window.location.href = LOGIN_ROUTE;
  }, 1500);
};

// Helper function for error handling
const handleError = (error: any) => {
  const { response, config } = error;

  if (response?.status === 403) {
    toast.error(formatApiError(error, "You don't have permission to perform this action."));
  } else if (response?.status === 404) {
    // Optional media/docs often 404 when the DB path exists but the file is gone —
    // don't spam the page with "resource was not found" toasts.
    const url = String(config?.url || "");
    const isOptionalMedia =
      config?.responseType === "blob" ||
      /\/(cnic-[\w-]*image|[\w-]*-proof|attachment|favicon|uploads\/)/i.test(url);
    if (!isOptionalMedia) {
      toast.error(formatApiError(error, "The requested resource was not found."));
    }
  } else if (response?.status === 429) {
    toast.error(formatApiError(error, "Too many requests. Please try again later."));
  } else if (response?.status >= 500) {
    toast.error(formatApiError(error, "Server error. Please try again later."));
  } else if (!response) {
    toast.error(formatApiError(error, "Network error. Please check your connection."));
  }
};

// Optional: Add methods for common API patterns
export const api = {
  get: axiosInstance.get,
  post: axiosInstance.post,
  put: axiosInstance.put,
  delete: axiosInstance.delete,
  patch: axiosInstance.patch,
  request: axiosInstance.request,
};

// Utility functions for file upload/download
export const downloadFile = async (url: string, filename: string) => {
  const response = await axiosInstance.get(url, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

export const uploadFile = async (url: string, file: File, data?: any) => {
  const formData = new FormData();
  formData.append('file', file);

  if (data) {
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
  }

  return axiosInstance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Export the instance as default
export default axiosInstance;
