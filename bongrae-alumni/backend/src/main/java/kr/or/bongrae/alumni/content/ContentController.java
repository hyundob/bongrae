package kr.or.bongrae.alumni.content;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ContentController {
    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "UP", "service", "bongrae-alumni-backend", "time", Instant.now().toString());
    }

    @GetMapping("/sample")
    public Map<String, Object> sample() {
        return Map.of(
            "message", "봉래초등학교 총동문회 API 연결 성공",
            "timezone", "Asia/Seoul",
            "timestamp", Instant.now().toString()
        );
    }

    @GetMapping("/site-info")
    public Map<String, Object> siteInfo() {
        return Map.of(
            "officialName", "봉래초등학교 총동문회",
            "purpose", "모교 발전 및 후원사업에 기여하고 동문 상호 간의 친목 도모",
            "office", "봉래초등학교 관내",
            "schoolAddress", "전라남도 고흥군 봉래면 신금길 7",
            "memberTypes", List.of("정회원", "명예회원"),
            "designKeywords", List.of("고흥", "나로도", "봉래산", "바다", "우주/항공우주", "비자나무", "동백", "파랑색")
        );
    }

    @GetMapping("/executives")
    public List<Map<String, String>> executives() {
        return List.of(
            Map.of("role", "고문", "name", "명경민", "classNo", "33"),
            Map.of("role", "고문", "name", "고홍만", "classNo", "34"),
            Map.of("role", "고문", "name", "지홍채", "classNo", "35"),
            Map.of("role", "회장", "name", "신판로", "classNo", "40기"),
            Map.of("role", "부회장", "name", "명연호", "classNo", "49"),
            Map.of("role", "감사", "name", "홍성찬", "classNo", "41"),
            Map.of("role", "감사", "name", "이봉선", "classNo", "52"),
            Map.of("role", "사무국장", "name", "명승현", "classNo", "62"),
            Map.of("role", "재무", "name", "정성동", "classNo", "57"),
            Map.of("role", "이사", "name", "김세현", "classNo", "43"),
            Map.of("role", "이사", "name", "명선채", "classNo", "44"),
            Map.of("role", "이사", "name", "고대광", "classNo", "47"),
            Map.of("role", "이사", "name", "고영평", "classNo", "48"),
            Map.of("role", "이사", "name", "김병도", "classNo", "49"),
            Map.of("role", "이사", "name", "홍민수", "classNo", "50"),
            Map.of("role", "이사", "name", "지성남", "classNo", "52"),
            Map.of("role", "이사", "name", "박기영", "classNo", "53"),
            Map.of("role", "이사", "name", "정신우", "classNo", "55"),
            Map.of("role", "이사", "name", "박요한", "classNo", "59"),
            Map.of("role", "이사", "name", "서한영", "classNo", "60"),
            Map.of("role", "이사", "name", "고지현", "classNo", "61"),
            Map.of("role", "이사", "name", "최혁철", "classNo", "62")
        );
    }

    @GetMapping("/rules")
    public List<Map<String, String>> rules() {
        return List.of(
            Map.of("title", "명칭", "body", "본 회는 봉래초등학교 총동문회라 하며, 이하 본 회라 칭한다."),
            Map.of("title", "목적", "body", "모교 발전 및 후원사업에 기여하고 동문 상호 간의 친목 도모를 목적으로 한다."),
            Map.of("title", "회원", "body", "회원은 정회원과 명예회원으로 한다."),
            Map.of("title", "정회원", "body", "봉래초등학교 졸업생과 3년 이상 재학하다가 전학을 간 사람으로 한다."),
            Map.of("title", "명예회원", "body", "전·현직 교직원 및 모교 발전에 공헌한 사람 중 이사회 추대를 받은 사람으로 한다."),
            Map.of("title", "임원 구성", "body", "회장, 부회장, 감사, 이사, 재무, 사무국장, 고문으로 구성한다."),
            Map.of("title", "재정", "body", "수입금은 회원의 후원금, 기부금, 찬조금, 기타 금전적 수입으로 충당한다.")
        );
    }

    @GetMapping("/school/history")
    public List<Map<String, String>> schoolHistory() {
        return List.of(
            Map.of("date", "1924. 8. 15", "summary", "봉래 공립보통학교 설치 인가"),
            Map.of("date", "1924. 9. 10", "summary", "봉래 공립보통학교 개교"),
            Map.of("date", "1938. 4. 1", "summary", "봉래공립심상소학교로 개칭"),
            Map.of("date", "1941. 4. 1", "summary", "봉래공립국민학교로 개칭"),
            Map.of("date", "1950. 6. 1", "summary", "봉래국민학교로 개칭"),
            Map.of("date", "1984. 9. 1", "summary", "콘크리트조 슬라브 8개 교실 개축 준공"),
            Map.of("date", "1996. 3. 1", "summary", "봉래초등학교로 개칭"),
            Map.of("date", "2020", "summary", "친일잔재 청산 교가 사업을 통해 새 교가 제정"),
            Map.of("date", "2024. 9. 10", "summary", "개교 100주년 기념사업")
        );
    }

    @GetMapping("/boards")
    public List<Map<String, String>> boards() {
        return List.of(
            Map.of("name", "공지사항", "type", "notice", "access", "PUBLIC"),
            Map.of("name", "행사안내", "type", "event", "access", "PUBLIC"),
            Map.of("name", "행사 사진·영상", "type", "gallery", "access", "MEMBER"),
            Map.of("name", "회의자료", "type", "meeting", "access", "CLASS_MANAGER"),
            Map.of("name", "자유게시판", "type", "free", "access", "MEMBER"),
            Map.of("name", "동문 동정", "type", "news", "access", "MEMBER"),
            Map.of("name", "애경사", "type", "family", "access", "MEMBER"),
            Map.of("name", "개업/이전/사업홍보", "type", "promotion", "access", "MEMBER"),
            Map.of("name", "장학/후원", "type", "support", "access", "PUBLIC")
        );
    }
}
