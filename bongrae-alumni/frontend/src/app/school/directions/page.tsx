"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window { kakao: any; } // eslint-disable-line @typescript-eslint/no-explicit-any
}

const busStops = [
  {
    id: "3320087",
    name: "신금",
    direction: "와교 방면 (고흥 방향)",
    routes: ["11", "12", "550", "591"],
  },
  {
    id: "3320086",
    name: "신금",
    direction: "나로도공용터미널 방면",
    routes: ["500", "501", "502", "503", "507", "508", "590"],
  },
];

export default function DirectionsPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [noKey, setNoKey] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!apiKey || apiKey === "YOUR_KAKAO_JS_API_KEY") {
      setNoKey(true);
      return;
    }

    function drawMap() {
      if (!mapRef.current) return;
      const { maps } = window.kakao;

      // 주소로 좌표 검색 (키워드 검색 시 부산 봉래초 혼동 방지)
      const geocoder = new maps.services.Geocoder();
      geocoder.addressSearch(
        "전라남도 고흥군 봉래면 신금길 7",
        (result: any[], status: string) => {
          if (status !== maps.services.Status.OK || !mapRef.current) return;
          const coords = new maps.LatLng(
            Number(result[0].y),
            Number(result[0].x)
          );
          const map = new maps.Map(mapRef.current, { center: coords, level: 4 });
          const marker = new maps.Marker({ position: coords });
          marker.setMap(map);
          new maps.InfoWindow({
            content:
              '<div style="padding:8px 14px;font-size:13px;font-weight:700;white-space:nowrap;">봉래초등학교</div>',
          }).open(map, marker);
        }
      );
    }

    if (window.kakao?.maps?.services) {
      drawMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onerror = () => setNoKey(true);
    script.onload = () => window.kakao.maps.load(drawMap);
    document.head.appendChild(script);
  }, []);

  const kakaoViewLink = "https://map.kakao.com/link/search/봉래초등학교";
  const kakaoNaviLink = "https://map.kakao.com/link/to/봉래초등학교,34.46833,127.47000";

  return (
    <section className="section">
      <p className="eyebrow">모교소개</p>
      <h1>오시는 길</h1>

      {/* 지도 */}
      <div className="map-wrap">
        <div
          ref={mapRef}
          className="kakao-map"
          aria-label="봉래초등학교 위치 지도"
          role="img"
        >
          {noKey && (
            <div className="map-placeholder">
              <p>카카오 지도 API 키를 설정하면 지도가 표시됩니다.</p>
              <code>.env.local → NEXT_PUBLIC_KAKAO_MAP_KEY</code>
            </div>
          )}
        </div>
        <div className="map-actions">
          <a href={kakaoViewLink} target="_blank" rel="noopener noreferrer" className="map-btn">
            카카오맵에서 보기
          </a>
          <a href={kakaoNaviLink} target="_blank" rel="noopener noreferrer" className="map-btn map-btn--navi">
            길 찾기
          </a>
        </div>
      </div>

      {/* 주소 + 교통 */}
      <div className="directions-layout">
        {/* 기본 정보 */}
        <div className="directions-card">
          <p className="directions-card-title">학교 주소</p>
          <p className="dir-address">
            전라남도 고흥군 봉래면 신금길 7
            <span className="dir-address-sub">(신금리 655번지)</span>
          </p>
          <dl className="dir-info">
            <div className="dir-info-row">
              <dt>교무실</dt>
              <dd>061-833-6384</dd>
            </div>
            <div className="dir-info-row">
              <dt>행정실</dt>
              <dd>061-833-6156</dd>
            </div>
            <div className="dir-info-row">
              <dt>팩스</dt>
              <dd>061-835-6055</dd>
            </div>
          </dl>
        </div>

        {/* 버스 */}
        <div className="directions-card">
          <p className="directions-card-title">버스 안내</p>
          <p className="dir-bus-note">
            학교 정문 앞 <strong>신금 정류장</strong> (2개소)
          </p>
          <div className="bus-stops">
            {busStops.map((stop) => (
              <div key={stop.id} className="bus-stop-row">
                <div className="bus-stop-info">
                  <span className="bus-stop-name">{stop.name}</span>
                  <span className="bus-stop-dir">{stop.direction}</span>
                  <span className="bus-stop-id">정류장 번호 {stop.id}</span>
                </div>
                <div className="bus-route-list">
                  {stop.routes.map((r) => (
                    <span key={r} className="bus-route-badge">{r}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="bus-route-desc">
            고흥터미널 ↔ 봉래면(신금) ↔ 나로도 구간 운행<br />
            일요일·공휴일 일부 미운행 — 사전 확인 필요<br />
            <span className="dir-address-sub">문의: 고흥군청 061-830-6018</span>
          </p>
        </div>
      </div>
    </section>
  );
}
