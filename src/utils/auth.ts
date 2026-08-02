export const getToken = () => {
    return localStorage.getItem('token');
  };
  

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('company_id');
  localStorage.removeItem('role');
  localStorage.removeItem('id');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('companyAuthChange'));
  }
};

export const getRefreshToken = () => {
  return localStorage.getItem('token');
};

export const getAssetUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path;
  }
  const apiBase = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${cleanPath}`;
};