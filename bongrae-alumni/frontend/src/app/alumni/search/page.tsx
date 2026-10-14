"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { AuthGate, useAuth } from "@/components/AuthProvider";
import { PageShell } from "@/components/PageShell";
import { Pagination } from "@/components/Pagination";
import { useRemote } from "@/lib/useRemote";
import { PageResult } from "@/lib/api";
type Alumni = {
  name: string;
  class_no: number;
  graduation_year: number;
  registered: boolean;
};
export default function AlumniSearchPage() {
  return (
    <PageShell title="동문 검색" group="봉래人">
      <AuthGate>
        <SearchContent />
      </AuthGate>
    </PageShell>
  );
}
function SearchContent() {
  const { user } = useAuth();
  const [query, setQuery] = useState<{
    name: string;
    classNo: string;
    page: number;
  } | null>(null);
  const params = new URLSearchParams({
    name: query?.name ?? "",
    page: String(query?.page ?? 0),
  });
  if (query?.classNo) params.set("classNo", query.classNo);
  const { data, error } = useRemote<PageResult<Alumni>>(
    query && user ? "/api/alumni?" + params : null,
  );
  return (
    <>
      <form
        className="directory-search"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setQuery({
            name: String(form.get("name") ?? ""),
            classNo: String(form.get("classNo") ?? ""),
            page: 0,
          });
        }}
      >
        <label>
          졸업 기수
          <input
            type="number"
            name="classNo"
            min={1}
            max={new Date().getFullYear() - 1926}
            placeholder="전체 기수"
          />
        </label>
        <label>
          이름
          <input name="name" maxLength={50} placeholder="두 글자 이상" />
        </label>
        <button className="action">
          <Search size={18} />
          검색
        </button>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!query ? (
        <p className="empty-state">
          찾고 싶은 동문의 기수 또는 이름을 입력해 주세요.
        </p>
      ) : !data && !error ? (
        <p className="empty-state" role="status">
          검색 중입니다.
        </p>
      ) : (
        data && (
          <>
            <p className="result-count">
              검색 결과 <strong>{data.total}</strong>명
            </p>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>졸업 기수</th>
                    <th>졸업 연도</th>
                    <th>사이트 가입</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((person, index) => (
                    <tr key={index}>
                      <td>{person.name}</td>
                      <td>{person.class_no}회</td>
                      <td>{person.graduation_year}년</td>
                      <td>
                        <span
                          className={
                            person.registered
                              ? "status-tag active"
                              : "status-tag"
                          }
                        >
                          {person.registered ? "가입" : "미가입"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.items.length === 0 && (
              <p className="empty-state">검색 결과가 없습니다.</p>
            )}
            <Pagination
              page={query.page}
              pages={data.pages}
              onChange={(page) => setQuery({ ...query, page })}
            />
          </>
        )
      )}
    </>
  );
}
