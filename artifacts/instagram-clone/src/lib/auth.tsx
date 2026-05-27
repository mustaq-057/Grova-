import { createContext, useContext, useState } from "react";
import type { ApiUser } from "./api";

type AuthContextType = {
  user: ApiUser | null;
  setUser: (u: ApiUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<ApiUser | null>(() => {
    try {
      const s = localStorage.getItem("grova_user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const setUser = (u: ApiUser | null) => {
    setUserState(u);
    if (u) localStorage.setItem("grova_user", JSON.stringify(u));
    else localStorage.removeItem("grova_user");
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
