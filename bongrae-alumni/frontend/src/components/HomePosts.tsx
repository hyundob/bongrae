"use client";
import Link from "next/link";
import { boardPath, dateText, PageResult } from "@/lib/api";
import { useRemote } from "@/lib/useRemote";
import type { PostSummary } from "./BoardPage";
export function HomePosts({ board }: { board: string }) {
  const { data, error, reload } = useRemote<PageResult<PostSummary>>(
    `/api/boards/${board}/posts`,
  );
  if (error)
    return (
      <div className="home-post-state">
        <p role="alert">소식을 불러오지 못했습니다.</p>
        <button className="text-button" onClick={reload}>
          다시 시도
        </button>
      </div>
    );
  if (!data)
    return (
      <p className="home-post-state" role="status">
        소식을 불러오는 중입니다.
      </p>
    );
  if (!data.items.length)
    return <p className="home-post-state">등록된 소식이 없습니다.</p>;
  return (
    <ul className="post-list">
      {data.items.slice(0, 4).map((post) => (
        <li key={post.id}>
          <Link href={`${boardPath(board)}?post=${post.id}`}>{post.title}</Link>
          <time>{dateText(post.created_at)}</time>
        </li>
      ))}
    </ul>
  );
}
