"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import {
  api,
  boardNames,
  dateText,
  isAdmin,
  message,
  PageResult,
} from "@/lib/api";
import { useRemote } from "@/lib/useRemote";
import { useAuth, AuthGate } from "./AuthProvider";
import { PageShell } from "./PageShell";
import { Pagination } from "./Pagination";
export type PostSummary = {
  id: number;
  title: string;
  author_name: string;
  created_at: string;
  thumbnail?: string;
};
type Media = {
  id: string;
  filename: string;
  content_type: string;
  byte_size: number;
};
type Post = PostSummary & {
  body: string;
  version: number;
  canEdit: boolean;
  media: Media[];
};
export function BoardPage({ board }: { board: string }) {
  return (
    <PageShell
      title={boardNames[board]}
      group={board === "free" ? "열린 광장" : "알림마당"}
    >
      <Suspense fallback={<p className="empty-state">불러오는 중</p>}>
        <BoardContent board={board} />
      </Suspense>
    </PageShell>
  );
}
function BoardContent({ board }: { board: string }) {
  const search = useSearchParams();
  const path = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const id = search.get("post");
  const edit = search.has("edit");
  const write = search.has("write");
  if (write)
    return (
      <AuthGate>
        {board === "free" || isAdmin(user) ? (
          <PostEditor
            board={board}
            onSaved={(id) => router.push(`${path}?post=${id}`)}
          />
        ) : (
          <p className="empty-state">관리자만 작성할 수 있습니다.</p>
        )}
      </AuthGate>
    );
  if (id)
    return (
      <PostDetail
        key={`${board}:${id}:${edit}`}
        board={board}
        id={id}
        edit={edit}
      />
    );
  return <PostList board={board} />;
}
function PostList({ board }: { board: string }) {
  const search = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const { user } = useAuth();
  const q = search.get("q") ?? "";
  const page = Math.max(0, Number(search.get("page")) || 0);
  const { data, error, reload } = useRemote<PageResult<PostSummary>>(
    `/api/boards/${board}/posts?${new URLSearchParams({ q, page: String(page) })}`,
  );
  function change(query: string, nextPage: number) {
    router.push(
      `${path}?${new URLSearchParams({ q: query, page: String(nextPage) })}`,
    );
  }
  return (
    <>
      <div className="board-toolbar">
        <span>
          전체 <strong>{data?.total ?? "-"}</strong>건
        </span>
        <form
          className="search-inline"
          onSubmit={(e) => {
            e.preventDefault();
            change(String(new FormData(e.currentTarget).get("q") ?? ""), 0);
          }}
        >
          <input
            key={q}
            name="q"
            aria-label="제목 검색"
            defaultValue={q}
            maxLength={100}
            placeholder="제목 검색"
          />
          <button className="icon-button" title="검색">
            <Search size={19} />
          </button>
        </form>
        {user && (board === "free" || isAdmin(user)) && (
          <Link className="action" href={`${path}?write=1`}>
            <Plus size={18} />
            글쓰기
          </Link>
        )}
      </div>
      {error ? (
        <div className="empty-state">
          <p role="alert">{error}</p>
          <button className="action secondary" onClick={reload}>
            다시 시도
          </button>
        </div>
      ) : !data ? (
        <p className="empty-state" role="status">
          게시글을 불러오는 중입니다.
        </p>
      ) : !data.items.length ? (
        <p className="empty-state">
          {q ? "검색 결과가 없습니다." : "등록된 게시글이 없습니다."}
        </p>
      ) : board === "gallery" ? (
        <div className="media-grid">
          {data.items.map((post) => (
            <Link
              href={`${path}?post=${post.id}`}
              key={post.id}
              className="media-item"
            >
              {post.thumbnail ? (
                <img src={post.thumbnail} alt={post.title} />
              ) : (
                <div className="media-placeholder">봉래초등학교 총동문회</div>
              )}
              <strong>{post.title}</strong>
              <time>{dateText(post.created_at)}</time>
            </Link>
          ))}
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table board-table">
            <thead>
              <tr>
                <th className="number-column">번호</th>
                <th>제목</th>
                <th>작성자</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((post) => (
                <tr key={post.id}>
                  <td className="number-column">{post.id}</td>
                  <td>
                    <Link href={`${path}?post=${post.id}`}>{post.title}</Link>
                  </td>
                  <td>{post.author_name}</td>
                  <td>
                    <time>{dateText(post.created_at)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && (
        <Pagination
          page={page}
          pages={data.pages}
          onChange={(p) => change(q, p)}
        />
      )}
    </>
  );
}
function PostDetail({
  board,
  id,
  edit,
}: {
  board: string;
  id: string;
  edit: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const { data, error, reload } = useRemote<Post>(
    `/api/boards/${board}/posts/${encodeURIComponent(id)}`,
  );
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!data || !window.confirm("이 게시글과 첨부파일을 삭제할까요?")) return;
    setBusy(true);
    try {
      await api(`/api/boards/${board}/posts/${id}?version=${data.version}`, {
        method: "DELETE",
      });
      router.push(path);
    } catch (e) {
      setFailure(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <div className="empty-state">
        <p role="alert">{error}</p>
        <button className="action secondary" onClick={reload}>
          다시 시도
        </button>
        <Link href={path} className="text-link">
          목록
        </Link>
      </div>
    );
  if (!data)
    return (
      <p className="empty-state" role="status">
        게시글을 불러오는 중입니다.
      </p>
    );
  if (edit)
    return (
      <AuthGate>
        {data.canEdit ? (
          <PostEditor
            board={board}
            post={data}
            onSaved={(id) => router.push(`${path}?post=${id}`)}
          />
        ) : (
          <p className="empty-state">수정할 권한이 없습니다.</p>
        )}
      </AuthGate>
    );
  return (
    <article className="post-detail">
      <h2>{data.title}</h2>
      <div className="post-meta">
        <span>{data.author_name}</span>
        <time>{dateText(data.created_at)}</time>
      </div>
      <div className="post-body">{data.body}</div>
      <div className="post-media">
        {data.media.map((file) => (
          <figure key={file.id}>
            {file.content_type.startsWith("video/") ? (
              <video
                controls
                preload="metadata"
                src={`/api/media/${file.id}`}
              />
            ) : (
              <a href={`/api/media/${file.id}`} target="_blank" rel="noopener">
                <img src={`/api/media/${file.id}`} alt={file.filename} />
              </a>
            )}
            <figcaption>{file.filename}</figcaption>
          </figure>
        ))}
      </div>
      {failure && (
        <p className="form-error" role="alert">
          {failure}
        </p>
      )}
      <div className="actions">
        <Link className="action secondary" href={path}>
          <ArrowLeft size={18} />
          목록
        </Link>
        {data.canEdit && (
          <>
            <Link
              className="action secondary"
              href={`${path}?post=${id}&edit=1`}
            >
              <Pencil size={18} />
              수정
            </Link>
            <button
              title="게시글 삭제"
              className="icon-button danger"
              onClick={remove}
              disabled={busy}
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
function PostEditor({
  board,
  post,
  onSaved,
}: {
  board: string;
  post?: Post;
  onSaved: (id: number) => void;
}) {
  const path = usePathname();
  const [files, setFiles] = useState<Media[]>(post?.media ?? []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length + files.length > 5) {
      setError("첨부파일은 최대 5개입니다.");
      return;
    }
    if (selected.some((file) => file.size > 16 * 1024 * 1024)) {
      setError("파일당 16MB 이하여야 합니다.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      for (const file of selected) {
        const form = new FormData();
        form.append("file", file);
        const result = await api<Media>("/api/media", {
          method: "POST",
          body: form,
        });
        setFiles((old) => [...old, result]);
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(file: Media) {
    setBusy(true);
    try {
      if (!post?.media.some((item) => item.id === file.id))
        await api(`/api/media/${file.id}`, { method: "DELETE" });
      setFiles((items) => items.filter((item) => item.id !== file.id));
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const saved = await api<{ id: number }>(
        `/api/boards/${board}/posts${post ? `/${post.id}` : ""}`,
        {
          method: post ? "PUT" : "POST",
          body: JSON.stringify({
            title: form.get("title"),
            body: form.get("body"),
            mediaIds: files.map((file) => file.id),
            version: post?.version ?? 0,
          }),
        },
      );
      onSaved(saved.id);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="member-form post-editor" onSubmit={submit} method="post">
      <label>
        제목
        <input
          name="title"
          required
          maxLength={200}
          defaultValue={post?.title}
        />
      </label>
      <label>
        내용
        <textarea
          name="body"
          required
          maxLength={30000}
          rows={15}
          defaultValue={post?.body}
        />
      </label>
      <label>
        첨부파일 (PNG·JPEG·MP4, 파일당 16MB, 최대 5개)
        <input
          type="file"
          accept="image/png,image/jpeg,video/mp4"
          multiple
          onChange={upload}
          disabled={busy || files.length >= 5}
        />
      </label>
      <ul className="attachment-list">
        {files.map((file) => (
          <li key={file.id}>
            <span>{file.filename}</span>
            <button
              type="button"
              className="icon-button"
              title={`${file.filename} 제거`}
              disabled={busy}
              onClick={() => void remove(file)}
            >
              <X size={18} />
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button className="action" disabled={busy}>
          <Save size={18} />
          {busy ? "처리 중" : "저장"}
        </button>
        <Link
          className="action secondary"
          href={post ? `${path}?post=${post.id}` : path}
        >
          취소
        </Link>
      </div>
    </form>
  );
}
