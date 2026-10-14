"use client";

import { useState } from "react";

const PROVINCES = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도",
  "경상남도", "제주특별자치도"
];

// 기수별 도시 목록은 추후 확정 — 임시로 공통 예시 사용
const CITIES_BY_PROVINCE: Record<string, string[]> = {
  "서울특별시": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
  "부산광역시": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
  "전라남도": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
};

// 01회 = 1927년, class_no 기수: 졸업연도 = 1926 + class_no
function getGraduationYear(classNo: number): number {
  return 1926 + classNo;
}

export default function SignupPage() {
  const [province, setProvince] = useState("");
  const [classNo, setClassNo] = useState("");

  const cities = province ? (CITIES_BY_PROVINCE[province] ?? []) : [];
  const graduationYear = classNo ? getGraduationYear(Number(classNo)) : "";

  return (
    <section className="section narrow">
      <p className="eyebrow">회원가입</p>
      <h1>봉래초등학교 총동문회 회원가입</h1>
      <p className="lead">
        가입 후 관리자 승인을 받으면 회원 권한이 부여됩니다.
      </p>

      <form className="form-panel">
        <label>
          아이디 <span aria-hidden="true">*</span>
          <input type="text" name="username" required autoComplete="username" />
        </label>

        <label>
          비밀번호 <span aria-hidden="true">*</span>
          <input type="password" name="password" required autoComplete="new-password" />
        </label>

        <label>
          비밀번호 확인 <span aria-hidden="true">*</span>
          <input type="password" name="passwordConfirm" required autoComplete="new-password" />
        </label>

        <label>
          이름 <span aria-hidden="true">*</span>
          <input type="text" name="name" required />
        </label>

        <label>
          이메일 <span aria-hidden="true">*</span>
          <input type="email" name="email" required autoComplete="email" />
        </label>

        <label>
          휴대폰 번호 <span aria-hidden="true">*</span>
          <input type="tel" name="phone" placeholder="010-0000-0000" required />
        </label>

        <fieldset>
          <legend>거주 지역</legend>
          <div className="region-row">
            <label>
              도/특별시/광역시
              <select
                name="regionProvince"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              >
                <option value="">선택</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              시/군/구
              <select name="regionCity" disabled={cities.length === 0}>
                <option value="">선택</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <label>
          졸업 기수 <span aria-hidden="true">*</span>
          <select
            name="classNo"
            value={classNo}
            onChange={(e) => setClassNo(e.target.value)}
            required
          >
            <option value="">선택</option>
            {Array.from({ length: 99 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}회</option>
            ))}
          </select>
        </label>

        <label>
          졸업 연도
          <input
            type="text"
            name="graduationYear"
            readOnly
            value={graduationYear ? `${graduationYear}년` : ""}
            placeholder="기수 선택 시 자동 입력"
          />
        </label>

        <div className="agreement-box">
          <label>
            <input type="checkbox" name="termsAgreed" required />
            이용약관 동의 <span aria-hidden="true">(필수)</span>
          </label>
          <label>
            <input type="checkbox" name="privacyAgreed" required />
            개인정보 수집·이용 동의 <span aria-hidden="true">(필수)</span>
          </label>
          <label>
            <input type="checkbox" name="smsAgreed" />
            문자(SMS) 수신 동의 <span aria-hidden="true">(선택)</span>
          </label>
          <label>
            <input type="checkbox" name="emailAgreed" />
            이메일 수신 동의 <span aria-hidden="true">(선택)</span>
          </label>
        </div>

        <button type="submit">가입 신청</button>
      </form>
    </section>
  );
}
