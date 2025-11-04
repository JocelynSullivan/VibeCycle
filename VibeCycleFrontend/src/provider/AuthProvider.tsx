import axios from "axios";
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

type AuthContextType = {
  token: string | null;
  setToken: (newToken: string | null) => void;
  username: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [token, setToken_] = useState<string | null>(localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(null);

  const setToken = (newToken: string | null) => {
    setToken_(newToken);
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = "Bearer " + token;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [token]);

  // fetch current user when token is present
  useEffect(() => {
    if (!token) {
      setUsername(null);
      return;
    }

    // call backend to get current user info
    (async () => {
      try {
        const res = await axios.get("http://localhost:8000/users/me");
        setUsername(res.data?.username ?? null);
      } catch (e) {
        setUsername(null);
      }
    })();
  }, [token]);

  const contextValue = useMemo(
    () => ({
      token,
      setToken,
      username,
    }),
    [token]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

export default AuthProvider;
