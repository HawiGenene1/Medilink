// TODO: Implement authentication API calls
// Functions: login, register, logout, refreshToken, etc.

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const authAPI = {
  // TODO: Implement login
  login: async (credentials) => {
    // return await fetch(`${API_URL}/auth/login`, {...})
  },
  
  // TODO: Implement register  
  register: async (userData) => {
    // return await fetch(`${API_URL}/auth/register`, {...})
  },
  
  // TODO: Implement logout
  logout: async () => {
    // return await fetch(`${API_URL}/auth/logout`, {...})
  }
};
