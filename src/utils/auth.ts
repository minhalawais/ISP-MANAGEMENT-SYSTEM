export const getToken = () => {
    return localStorage.getItem('token');
  };
  

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const getRefreshToken = () => {
  return localStorage.getItem('token');
}