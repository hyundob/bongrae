/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${process.env.BACKEND_URL || "http://127.0.0.1:8080"}/api/:path*` }];
  },

  async redirects() {
    return [
      // 구형 단일 페이지 → 새 서브경로
      { source: "/rules",      destination: "/about/rules",      permanent: true },
      { source: "/executives", destination: "/about/executives",  permanent: true },
      { source: "/history",    destination: "/school/history",    permanent: true },
      { source: "/alumni",     destination: "/alumni/search",     permanent: true },

      // 구형 게시판 쿼리 → 새 경로 (has 조건이 구체적이므로 catch-all보다 먼저)
      {
        source: "/boards",
        has: [{ type: "query", key: "type", value: "event" }],
        destination: "/notice/events",
        permanent: false
      },
      {
        source: "/boards",
        has: [{ type: "query", key: "type", value: "gallery" }],
        destination: "/notice/gallery",
        permanent: false
      },
      {
        source: "/boards",
        has: [{ type: "query", key: "type", value: "office" }],
        destination: "/notice/affairs",
        permanent: false
      },
      {
        source: "/boards",
        has: [{ type: "query", key: "type", value: "free" }],
        destination: "/board/free",
        permanent: false
      },
      // catch-all: /boards 나머지 → 공지사항
      { source: "/boards", destination: "/notice/announcements", permanent: false }
    ];
  }
};

export default nextConfig;
