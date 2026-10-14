"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { api, ApiError, isAdmin, Member, message } from "@/lib/api";
type Auth = {
  user: Member | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  setUser: (user: Member | null) => void;
  logout: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, updateUser] = useState<Member | null>(null);
  const generation = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const setUser = useCallback((member: Member | null) => {
    generation.current++;
    updateUser(member);
    setLoading(false);
    setError("");
  }, []);
  const refresh = useCallback(() => {
    const request = ++generation.current;
    return api<Member>("/api/auth/me")
      .then((member) => {
        if (request === generation.current) {
          updateUser(member);
          setError("");
        }
      })
      .catch((e) => {
        if (request === generation.current) {
          updateUser(null);
          setError(e instanceof ApiError && e.status === 401 ? "" : message(e));
        }
      })
      .finally(() => {
        if (request === generation.current) setLoading(false);
      });
  }, []);
  useEffect(() => {
    void refresh();
    const focus = () => {
      void refresh();
    };
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, [refresh]);
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  }
  return (
    <Context.Provider
      value={{ user, loading, error, refresh, setUser, logout }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider required");
  return value;
}
export function AuthGate({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const { user, loading, error, refresh } = useAuth();
  if (loading)
    return (
      <p className="empty-state" role="status">
        회원 정보를 확인하고 있습니다.
      </p>
    );
  if (error)
    return (
      <div className="empty-state">
        <p role="alert">{error}</p>
        <button className="action" onClick={() => void refresh()}>
          다시 시도
        </button>
      </div>
    );
  if (!user)
    return (
      <div className="empty-state">
        <h2>로그인이 필요합니다</h2>
        <Link className="action" href="/login">
          로그인
        </Link>
        <Link className="text-link" href="/signup">
          회원가입
        </Link>
      </div>
    );
  if (admin && !isAdmin(user))
    return (
      <p className="empty-state" role="alert">
        관리자만 접근할 수 있습니다.
      </p>
    );
  return children;
}
