"use client";
import { useEffect, useState } from "react";
import { api, message } from "./api";
export function useRemote<T>(url: string | null) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  }>({ key: "" });
  const key = `${url}:${revision}`;
  useEffect(() => {
    if (!url) return;
    let active = true;
    api<T>(url)
      .then((data) => {
        if (active) setResult({ key, data });
      })
      .catch((error) => {
        if (active) setResult({ key, error: message(error) });
      });
    return () => {
      active = false;
    };
  }, [url, key]);
  return {
    data: result.key === key ? result.data : undefined,
    error: result.key === key ? result.error : undefined,
    loading: !!url && result.key !== key,
    reload: () => setRevision((n) => n + 1),
  };
}
