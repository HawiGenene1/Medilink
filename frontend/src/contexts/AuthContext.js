// TODO: Implement AuthContext for user authentication and role management
// This should store: user data, role, pharmacyId (if applicable)

import { createContext } from 'react';

export const AuthContext = createContext(null);

// Placeholder - implement when backend authentication is ready
export const AuthProvider = ({ children }) => {
  return children;
};
