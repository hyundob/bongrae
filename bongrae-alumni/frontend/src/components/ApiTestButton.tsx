"use client";

import { useState } from "react";

type ApiState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

export function ApiTestButton() {
  const [state, setState] = useState<ApiState>({ status: "idle", message: "" });

  async function testApi() {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
    setState({ status: "loading", message: "확인 중" });

    try {
      const response = await fetch(`${baseUrl}/sample`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as { message?: string };
      setState({ status: "success", message: data.message || "API 연결 성공" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "API 연결 실패";
      setState({ status: "error", message });
    }
  }

  return (
    <div className="api-test">
      <button type="button" onClick={testApi} disabled={state.status === "loading"}>
        API 연결 확인
      </button>
      {state.message ? <span data-state={state.status}>{state.message}</span> : null}
    </div>
  );
}
