"use client";
import { useState } from "react";
import { Pencil, Save, Search, Trash2, Plus } from "lucide-react";
import { api, message, PageResult } from "@/lib/api";
import { useRemote } from "@/lib/useRemote";
import { useAuth } from "./AuthProvider";
import { Pagination } from "./Pagination";
type ManagedMember = {
  id: number;
  username: string;
  name: string;
  classNo: number | null;
  role: string;
};
type RecordItem = {
  id: number;
  name: string;
  class_no: number;
  user_id: number | null;
  consent_confirmed: boolean;
  source_note: string;
};
const roles: Record<string, string> = {
  SUPER_ADMIN: "총괄 관리자",
  ADMIN: "관리자",
  MEMBER: "회원",
  PENDING: "기존 대기 회원",
  GUEST: "방문자",
};
export function AdminWorkspace() {
  const [tab, setTab] = useState("members");
  return (
    <>
      <div className="view-tabs" role="tablist" aria-label="관리 메뉴">
        <button
          role="tab"
          aria-selected={tab === "members"}
          onClick={() => setTab("members")}
        >
          회원 및 권한
        </button>
        <button
          role="tab"
          aria-selected={tab === "directory"}
          onClick={() => setTab("directory")}
        >
          동문 명부
        </button>
      </div>
      <div role="tabpanel">
        {tab === "members" ? <Members /> : <Directory />}
      </div>
    </>
  );
}
function Members() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [page, setPage] = useState(0);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, error, reload } = useRemote<PageResult<ManagedMember>>(
    `/api/admin/members?${new URLSearchParams({ name, page: String(page) })}`,
  );
  async function change(
    event: React.FormEvent<HTMLFormElement>,
    member: ManagedMember,
  ) {
    event.preventDefault();
    const role = new FormData(event.currentTarget).get("role");
    if (
      role === member.role ||
      !window.confirm(
        `${member.name} 회원의 권한을 ${roles[String(role)]}(으)로 변경할까요?`,
      )
    )
      return;
    setBusy(true);
    setFailure("");
    try {
      await api(`/api/admin/members/${member.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      reload();
    } catch (e) {
      setFailure(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form
        className="board-toolbar search-inline"
        onSubmit={(e) => {
          e.preventDefault();
          setName(String(new FormData(e.currentTarget).get("name")));
          setPage(0);
        }}
      >
        <input
          name="name"
          aria-label="회원 이름 검색"
          maxLength={50}
          placeholder="회원 이름"
        />
        <button className="icon-button" title="회원 검색">
          <Search size={18} />
        </button>
      </form>
      {(error || failure) && (
        <p role="alert" className="form-error">
          {error || failure}
        </p>
      )}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>회원</th>
              <th>아이디</th>
              <th>기수</th>
              <th>권한</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.username}</td>
                <td>{member.classNo ? `${member.classNo}회` : "-"}</td>
                <td>
                  {user?.role === "SUPER_ADMIN" &&
                  member.role !== "SUPER_ADMIN" ? (
                    <form
                      className="role-control"
                      onSubmit={(e) => void change(e, member)}
                    >
                      <select
                        aria-label={`${member.name} 권한`}
                        defaultValue={member.role}
                        key={`${member.id}:${member.role}`}
                        name="role"
                      >
                        <option value="MEMBER">회원</option>
                        <option value="ADMIN">관리자</option>
                        {member.role === "PENDING" && (
                          <option value="PENDING">기존 대기 회원</option>
                        )}
                      </select>
                      <button
                        className="icon-button"
                        title={`${member.name} 권한 저장`}
                        disabled={busy}
                      >
                        <Save size={18} />
                      </button>
                    </form>
                  ) : (
                    roles[member.role]
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data && !error && (
        <p role="status" className="empty-state">
          불러오는 중입니다.
        </p>
      )}
      {data?.total === 0 && (
        <p className="empty-state">검색 결과가 없습니다.</p>
      )}
      {data && <Pagination page={page} pages={data.pages} onChange={setPage} />}
    </>
  );
}
function Directory() {
  const [name, setName] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<RecordItem | "new" | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const result = useRemote<PageResult<RecordItem>>(
    `/api/admin/directory?${new URLSearchParams({ name, page: String(page) })}`,
  );
  async function remove(item: RecordItem) {
    if (
      !window.confirm(
        `${item.name} 동문을 명부에서 삭제할까요? 사이트 회원 계정은 유지됩니다.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/directory/${item.id}`, { method: "DELETE" });
      result.reload();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (editing)
    return (
      <RecordEditor
        item={editing === "new" ? undefined : editing}
        done={() => {
          setEditing(null);
          result.reload();
        }}
      />
    );
  return (
    <>
      <div className="board-toolbar">
        <form
          className="search-inline"
          onSubmit={(e) => {
            e.preventDefault();
            setName(String(new FormData(e.currentTarget).get("name")));
            setPage(0);
          }}
        >
          <input
            name="name"
            aria-label="명부 이름 검색"
            placeholder="동문 이름"
            maxLength={50}
          />
          <button className="icon-button" title="명부 검색">
            <Search size={18} />
          </button>
        </form>
        <button className="action" onClick={() => setEditing("new")}>
          <Plus size={18} />
          동문 등록
        </button>
      </div>
      {(error || result.error) && (
        <p className="form-error" role="alert">
          {error || result.error}
        </p>
      )}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>기수</th>
              <th>정보 제공 동의</th>
              <th>회원 연결</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {result.data?.items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.class_no}회</td>
                <td>{item.consent_confirmed ? "확인" : "미확인"}</td>
                <td>{item.user_id ? "연결됨" : "미연결"}</td>
                <td>
                  <div className="actions compact">
                    <button
                      className="icon-button"
                      title={`${item.name} 수정`}
                      onClick={() => setEditing(item)}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      className="icon-button danger"
                      title={`${item.name} 삭제`}
                      disabled={busy}
                      onClick={() => void remove(item)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {result.data?.total === 0 && (
        <p className="empty-state">등록된 동문이 없습니다.</p>
      )}
      {result.data && (
        <Pagination page={page} pages={result.data.pages} onChange={setPage} />
      )}
    </>
  );
}
function RecordEditor({ item, done }: { item?: RecordItem; done: () => void }) {
  const [memberName, setMemberName] = useState(item?.name ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const members = useRemote<PageResult<ManagedMember>>(
    memberName.trim().length >= 2
      ? `/api/admin/members?name=${encodeURIComponent(memberName)}`
      : null,
  );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/directory${item ? `/${item.id}` : ""}`, {
        method: item ? "PUT" : "POST",
        body: JSON.stringify({
          name: form.get("name"),
          classNo: Number(form.get("classNo")),
          sourceNote: form.get("sourceNote"),
          consentConfirmed: form.has("consentConfirmed"),
          userId: form.get("userId") ? Number(form.get("userId")) : null,
        }),
      });
      done();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="member-form" onSubmit={submit}>
      <h2>{item ? "동문 명부 수정" : "동문 등록"}</h2>
      <div className="field-grid">
        <label>
          이름
          <input
            name="name"
            required
            maxLength={50}
            defaultValue={item?.name}
            onChange={(e) => setMemberName(e.target.value)}
          />
        </label>
        <label>
          졸업 기수
          <input
            name="classNo"
            type="number"
            required
            min={1}
            max={new Date().getFullYear() - 1926}
            defaultValue={item?.class_no}
          />
        </label>
      </div>
      <label>
        자료 출처 및 동의 확인 기록
        <textarea
          name="sourceNote"
          rows={3}
          required
          maxLength={300}
          defaultValue={item?.source_note}
          placeholder="자료 출처, 동의 확인 일자와 방법"
        />
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          name="consentConfirmed"
          defaultChecked={item?.consent_confirmed}
        />
        동문 검색 정보 제공 동의를 확인했습니다
      </label>
      <label>
        가입 회원 연결 (본인 확인 후 선택)
        <select name="userId" defaultValue={item?.user_id ?? ""}>
          <option value="">연결하지 않음</option>
          {item?.user_id &&
            !members.data?.items.some(
              (member) => member.id === item.user_id,
            ) && (
              <option value={item.user_id}>
                기존 연결 회원 #{item.user_id}
              </option>
            )}
          {members.data?.items.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} / {member.classNo ?? "-"}회 / {member.username}
            </option>
          ))}
        </select>
      </label>
      {members.error && (
        <p className="form-error" role="alert">
          {members.error}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button className="action" disabled={busy}>
          <Save size={18} />
          저장
        </button>
        <button
          className="action secondary"
          type="button"
          onClick={done}
          disabled={busy}
        >
          취소
        </button>
      </div>
    </form>
  );
}
