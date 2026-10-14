"use client";
import { useState } from "react";
import { ArrowLeft, ClipboardCheck, Link2, RefreshCw, Search, X } from "lucide-react";
import { api, message, PageResult } from "@/lib/api";
import { useRemote } from "@/lib/useRemote";
import { Pagination } from "./Pagination";

type Review = {
  user_id: number;
  name: string;
  username: string;
  class_no: number;
  reason: string;
  status: "PENDING" | "LINKED" | "DISMISSED";
  candidate_count: number;
  record_id: number | null;
  created_at: string;
  reviewed_at: string | null;
};
type Candidate = {
  id: number;
  name: string;
  class_no: number;
  graduation_year: number | null;
  hometown: string | null;
  user_id: number | null;
  linked_username: string | null;
};
const reasons: Record<string, string> = {
  MULTIPLE_RECORDS: "동명이인 명부",
  MULTIPLE_MEMBERS: "같은 이름·기수의 가입 계정",
  RECORD_IN_USE: "다른 계정에 연결된 명부",
  EXISTING_MEMBER: "기존 미연결 회원",
};
const statuses = { PENDING: "확인 대기", LINKED: "연결 완료", DISMISSED: "연결 제외" };

export function DirectoryLinkReviews() {
  const [status, setStatus] = useState("PENDING");
  const [name, setName] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const result = useRemote<PageResult<Review>>(`/api/admin/directory-links?${new URLSearchParams({ status, name, page: String(page) })}`);
  if (selected !== null) return <ReviewDetail userId={selected} close={(saved) => {
    setSelected(null);
    if (saved) { setNotice(saved); setPage(0); }
    result.reload();
  }} />;
  return <>
    <div className="board-toolbar link-review-toolbar">
      <label>
        처리 상태
        <select aria-label="연결 처리 상태" value={status} onChange={e => { setStatus(e.target.value); setPage(0); setNotice(""); }}>
          {Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <form className="search-inline" onSubmit={e => {
        e.preventDefault(); setName(String(new FormData(e.currentTarget).get("name"))); setPage(0); setNotice("");
      }}>
        <input name="name" aria-label="연결 확인 회원 이름" placeholder="회원 이름" maxLength={50} defaultValue={name} />
        <button className="icon-button" title="연결 확인 검색"><Search size={18} /></button>
      </form>
      <button className="icon-button" title="연결 확인 새로고침" onClick={() => result.reload()}><RefreshCw size={18} /></button>
    </div>
    {notice && <p role="status" className="success-note">{notice}</p>}
    {result.error && <p role="alert" className="form-error">{result.error}</p>}
    {result.loading && <p role="status" className="empty-state">불러오는 중입니다.</p>}
    {result.data && <>
      <p className="review-count">{statuses[status as Review["status"]]} {result.data.total}명</p>
      {result.data.items.length > 0 ? <div className="table-scroll">
        <table className="data-table link-review-table">
          <thead><tr><th>가입 회원</th><th>기수</th><th>확인 사유</th><th>후보 명부</th></tr></thead>
          <tbody>{result.data.items.map(item => <tr key={item.user_id}>
            <td><button className="review-open" title={`${item.name} (${item.username}) 연결 확인`} aria-label={`${item.name} (${item.username}) 연결 확인`} onClick={() => { setNotice(""); setSelected(item.user_id); }}><ClipboardCheck size={16} /><span>{item.name}</span></button><span className="review-username">{item.username}</span></td>
            <td>{item.class_no}회</td><td>{reasons[item.reason] ?? item.reason}</td><td>{item.candidate_count}건</td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="empty-state">{status === "PENDING" ? "확인 대기 중인 회원이 없습니다." : "처리 내역이 없습니다."}</p>}
      <Pagination page={page} pages={result.data.pages} onChange={setPage} />
    </>}
  </>;
}

function ReviewDetail({ userId, close }: { userId: number; close: (notice?: string) => void }) {
  const result = useRemote<{ review: Review; candidates: Candidate[] }>(`/api/admin/directory-links/${userId}`);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = result.data?.candidates.find(item => item.id === recordId && item.user_id === null);
  async function decide(decision: "LINK" | "DISMISS") {
    if (busy || (decision === "LINK" && (!selected || !confirmed))) return;
    if (decision === "DISMISS" && !window.confirm("이 회원을 연결 대상에서 제외할까요? 회원 계정과 명부는 유지됩니다.")) return;
    setBusy(true); setError("");
    try {
      await api(`/api/admin/directory-links/${userId}`, { method: "POST", body: JSON.stringify({ decision, recordId: decision === "LINK" ? recordId : null }) });
      close(decision === "LINK" ? "회원과 동문 명부를 연결했습니다." : "연결 확인 대상에서 제외했습니다.");
    } catch (e) {
      setError(message(e)); setRecordId(null); setConfirmed(false); result.reload();
    } finally { setBusy(false); }
  }
  const data = result.data;
  return <section className="link-review-detail" aria-label="회원 연결 검토">
    <div className="board-toolbar">
      <button className="icon-button" title="연결 확인 목록으로" disabled={busy} onClick={() => close()}><ArrowLeft size={18} /></button>
      <h2>회원 연결 확인</h2>
      <button className="icon-button" title="후보 명부 새로고침" disabled={busy} onClick={() => { setRecordId(null); setConfirmed(false); result.reload(); }}><RefreshCw size={18} /></button>
    </div>
    {(error || result.error) && <p role="alert" className="form-error">{error || result.error}</p>}
    {result.loading && <p role="status" className="empty-state">불러오는 중입니다.</p>}
    {data && <>
      <dl className="review-member">
        <div><dt>가입 회원</dt><dd>{data.review.name} <span>({data.review.username})</span></dd></div>
        <div><dt>졸업 기수</dt><dd>{data.review.class_no}회</dd></div>
        <div><dt>확인 사유</dt><dd>{reasons[data.review.reason] ?? data.review.reason}</dd></div>
        <div><dt>처리 상태</dt><dd>{statuses[data.review.status]}</dd></div>
        {data.review.record_id && <div><dt>연결된 명부</dt><dd>#{data.review.record_id}</dd></div>}
      </dl>
      <fieldset className="link-candidates" disabled={busy || data.review.status !== "PENDING"}>
        <legend>후보 명부 {data.candidates.length}건</legend>
        {data.candidates.map(item => <label key={item.id} className="link-candidate">
          <input type="radio" name="recordId" value={item.id} checked={(data.review.status === "LINKED" ? data.review.record_id : recordId) === item.id} disabled={item.user_id !== null}
            onChange={() => { setRecordId(item.id); setConfirmed(false); }} aria-label={`명부 ${item.id}, ${item.hometown || "지역 미상"}`} />
          <span>
            <strong>{item.name} · {item.class_no}회</strong>
            <span>명부 지역: {item.hometown || "미상"} · 졸업연도: {item.graduation_year ?? "미상"}</span>
            <small>명부 #{item.id} · {item.user_id === null ? "미연결" : `연결됨 (${item.linked_username ?? item.user_id})`}</small>
          </span>
        </label>)}
      </fieldset>
      {data.review.status === "PENDING" && <>
        {!data.candidates.some(item => item.user_id === null) && <p className="empty-state">연결 가능한 명부가 없습니다.</p>}
        <label className="checkbox-row review-confirmation"><input type="checkbox" checked={confirmed} disabled={!selected || busy} onChange={e => setConfirmed(e.target.checked)} />본인 및 명부 일치를 확인했습니다</label>
        <div className="actions">
          <button className="action" disabled={busy || !selected || !confirmed} onClick={() => void decide("LINK")}><Link2 size={18} />연결 확정</button>
          <button className="action secondary" disabled={busy} onClick={() => void decide("DISMISS")}><X size={18} />연결 제외</button>
        </div>
      </>}
    </>}
  </section>;
}
