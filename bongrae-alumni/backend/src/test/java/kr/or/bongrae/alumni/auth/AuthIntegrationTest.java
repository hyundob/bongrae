package kr.or.bongrae.alumni.auth;

import java.net.*;
import java.net.http.*;
import java.util.*;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.*;
import org.springframework.test.annotation.DirtiesContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import org.flywaydb.core.Flyway;
import kr.or.bongrae.alumni.member.*;
import static org.assertj.core.api.Assertions.*;

@Tag("integration") @Testcontainers
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@DirtiesContext(classMode=DirtiesContext.ClassMode.AFTER_CLASS)
class AuthIntegrationTest {
    @Container static final PostgreSQLContainer<?> postgres=new PostgreSQLContainer<>("postgres:16-alpine").withDatabaseName("bongrae_harness");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry){
        registry.add("spring.datasource.url",postgres::getJdbcUrl);
        registry.add("spring.datasource.username",postgres::getUsername);
        registry.add("spring.datasource.password",postgres::getPassword);
    }
    @LocalServerPort int port;
    @Autowired ObjectMapper json;
    @Autowired UserAccountRepository users;
    @Autowired AlumniProfileRepository profiles;
    @Autowired PasswordEncoder passwords;
    @Autowired JdbcTemplate db;
    static final String PASSWORD="test-password-62";
    @BeforeEach void clear(){
        db.execute("TRUNCATE users, spring_session CASCADE");
    }
    class Browser {
        final CookieManager cookies=new CookieManager(null,CookiePolicy.ACCEPT_ALL);
        final HttpClient client=HttpClient.newBuilder().cookieHandler(cookies).build();
        HttpResponse<String> request(String method,String path,Object body,boolean csrf) throws Exception {
            var builder=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path));
            if(csrf){
                var token=tree(request("GET","/api/auth/csrf",null,false));
                builder.header(token.get("headerName").asText(),token.get("token").asText());
            }
            if(body!=null) builder.header("Content-Type","application/json");
            return client.send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build(),HttpResponse.BodyHandlers.ofString());
        }
        HttpResponse<String> get(String path) throws Exception{return request("GET",path,null,false);}
        HttpResponse<String> send(String method,String path,Object body) throws Exception{return request(method,path,body,true);}
        void signup(String username,boolean directory) throws Exception{assertThat(send("POST","/api/auth/signup",signupBody(username,directory)).statusCode()).isEqualTo(200);}
        void login(String username) throws Exception{assertThat(send("POST","/api/auth/login",Map.of("username",username,"password",PASSWORD)).statusCode()).isEqualTo(200);}
        HttpResponse<String> upload(byte[] content,String filename) throws Exception {
            var token=tree(get("/api/auth/csrf"));
            String boundary="test-bongrae-boundary";
            var bytes=new java.io.ByteArrayOutputStream();
            bytes.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\""+filename+"\"\r\nContent-Type: image/png\r\n\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
            bytes.write(content); bytes.write(("\r\n--"+boundary+"--\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
            var request=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/media"))
                .header(token.get("headerName").asText(),token.get("token").asText())
                .header("Content-Type","multipart/form-data; boundary="+boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(bytes.toByteArray())).build();
            return client.send(request,HttpResponse.BodyHandlers.ofString());
        }
    }
    JsonNode tree(HttpResponse<String> response) throws Exception {return json.readTree(response.body());}
    Map<String,Object> signupBody(String username,boolean directory){
        var body=new HashMap<String,Object>();
        body.put("username",username); body.put("password",PASSWORD); body.put("passwordConfirm",PASSWORD);
        body.put("name","테스트동문"); body.put("email",username+"@example.invalid"); body.put("phone","010-0000-0062");
        body.put("classNo",62); body.put("termsAgreed",true); body.put("privacyAgreed",true); body.put("ageConfirmed",true);
        body.put("directoryAgreed",directory); body.put("policyVersion",AuthService.POLICY_VERSION);
        return body;
    }
    long seed(String username,MemberRole role){
        var user=new UserAccount(username,passwords.encode(PASSWORD),"테스트관리",username+"@example.invalid",null,null,null,62,false,false,false,false);
        user.changeRole(role); users.saveAndFlush(user); profiles.saveAndFlush(new AlumniProfile(user)); return user.getId();
    }
    Map<String,Object> post(String title,long version){return Map.of("title",title,"body","테스트 게시글 본문","mediaIds",List.of(),"version",version);}

    @Test void signupSessionLoginLogoutAndPasswordHash() throws Exception {
        var browser=new Browser();
        browser.signup("member62",false);
        var user=users.findByUsername("member62").orElseThrow();
        assertThat(user.getRole()).isEqualTo(MemberRole.MEMBER);
        assertThat(passwords.matches(PASSWORD,user.getPasswordHash())).isTrue();
        assertThat(db.queryForObject("SELECT public_profile FROM alumni_profiles WHERE user_id=?",Boolean.class,user.getId())).isFalse();
        assertThat(tree(browser.get("/api/auth/me")).get("username").asText()).isEqualTo("member62");
        assertThat(browser.cookies.getCookieStore().getCookies()).anyMatch(cookie->cookie.isHttpOnly());
        assertThat(browser.send("POST","/api/auth/logout",null).statusCode()).isEqualTo(204);
        assertThat(browser.get("/api/auth/me").statusCode()).isEqualTo(401);
        browser.login("MEMBER62");
        assertThat(browser.get("/api/auth/me").statusCode()).isEqualTo(200);
        assertThat(browser.send("POST","/api/auth/login",Map.of("username","member62","password","wrong")).statusCode()).isEqualTo(401);
    }
    @Test void duplicateAndValidationAreRejectedWithoutWrites() throws Exception {
        var browser=new Browser();
        for(String field:List.of("termsAgreed","privacyAgreed","ageConfirmed","email","passwordConfirm","policyVersion")){
            var body=signupBody("member62",false);
            body.put(field,field.endsWith("Agreed")||field.equals("ageConfirmed")?false:"invalid");
            assertThat(browser.send("POST","/api/auth/signup",body).statusCode()).as(field).isEqualTo(400);
        }
        assertThat(users.count()).isZero();
        browser.signup("member62",false);
        assertThat(browser.send("POST","/api/auth/signup",signupBody("MEMBER62",false)).statusCode()).isEqualTo(409);
        var duplicateEmail=signupBody("othermember",false); duplicateEmail.put("email","MEMBER62@example.invalid");
        assertThat(browser.send("POST","/api/auth/signup",duplicateEmail).statusCode()).isEqualTo(409);
        assertThat(profiles.count()).isEqualTo(1);
    }
    @Test void anonymousAndCsrfGuardsProtectEveryWrite() throws Exception {
        var browser=new Browser();
        assertThat(browser.get("/api/health").statusCode()).isEqualTo(200);
        var catalog=tree(browser.get("/api/boards"));
        assertThat(catalog.size()).isEqualTo(5);
        for (var board:catalog) {
            assertThat(board.get("access").asText()).isEqualTo("PUBLIC");
            assertThat(browser.get("/api/boards/"+board.get("type").asText()+"/posts").statusCode()).isEqualTo(200);
        }
        assertThat(browser.get("/api/boards/free/posts").statusCode()).isEqualTo(200);
        assertThat(browser.get("/api/alumni?classNo=62").statusCode()).isEqualTo(401);
        assertThat(browser.get("/api/admin/members").statusCode()).isEqualTo(401);
        assertThat(browser.request("POST","/api/auth/signup",signupBody("member62",false),false).statusCode()).isEqualTo(403);
        assertThat(browser.send("POST","/api/boards/free/posts",post("anonymous",0)).statusCode()).isEqualTo(401);
        browser.signup("member62",false);
        assertThat(browser.request("POST","/api/boards/free/posts",post("csrf missing",0),false).statusCode()).isEqualTo(403);
    }
    @Test void directoryRespectsConsentAndNeverExposesContactInformation() throws Exception {
        var browser=new Browser(); browser.signup("member62",false);
        assertThat(tree(browser.get("/api/alumni?classNo=62")).get("total").asInt()).isZero();
        assertThat(browser.send("PATCH","/api/account/preferences",Map.of("directoryAgreed",true,"smsAgreed",false,"emailAgreed",true)).statusCode()).isEqualTo(200);
        var result=tree(browser.get("/api/alumni?classNo=62"));
        assertThat(result.get("total").asInt()).isEqualTo(1);
        assertThat(result.get("items").get(0).get("registered").asBoolean()).isTrue();
        assertThat(result.toString()).doesNotContain("email","phone","password","username","user_id");
        assertThat(browser.get("/api/alumni").statusCode()).isEqualTo(400);
        browser.send("PATCH","/api/account/preferences",Map.of("directoryAgreed",false,"smsAgreed",false,"emailAgreed",false));
        assertThat(tree(browser.get("/api/alumni?classNo=62")).get("total").asInt()).isZero();
    }
    @Test void superAdminGrantsAndRevokesWithoutReloginAndCannotBeDuplicated() throws Exception {
        seed("owner",MemberRole.SUPER_ADMIN);
        var owner=new Browser(); owner.login("owner");
        var member=new Browser(); member.signup("member62",false);
        long id=users.findByUsername("member62").orElseThrow().getId();
        assertThat(member.get("/api/admin/members").statusCode()).isEqualTo(403);
        assertThat(owner.send("PATCH","/api/admin/members/"+id+"/role",Map.of("role","ADMIN")).statusCode()).isEqualTo(204);
        assertThat(member.get("/api/admin/members").statusCode()).isEqualTo(200);
        assertThat(member.send("PATCH","/api/admin/members/"+id+"/role",Map.of("role","MEMBER")).statusCode()).isEqualTo(403);
        assertThat(owner.send("PATCH","/api/admin/members/"+id+"/role",Map.of("role","SUPER_ADMIN")).statusCode()).isEqualTo(400);
        assertThatThrownBy(()->db.update("UPDATE users SET role='SUPER_ADMIN' WHERE id=?",id)).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        owner.send("PATCH","/api/admin/members/"+id+"/role",Map.of("role","MEMBER"));
        assertThat(member.get("/api/admin/members").statusCode()).isEqualTo(403);
        assertThat(db.queryForObject("SELECT count(*) FROM admin_audit",Long.class)).isEqualTo(2);
    }
    @Test void directoryRecordsRequireVerifiedLinkAndPublicationConsent() throws Exception {
        seed("editor",MemberRole.ADMIN); var admin=new Browser(); admin.login("editor");
        var member=new Browser(); member.signup("member62",true);
        var record=new HashMap<String,Object>(); record.put("name","미가입동문"); record.put("classNo",62); record.put("sourceNote","가상 자료 / 테스트 동의 기록"); record.put("consentConfirmed",false);
        long id=tree(admin.send("POST","/api/admin/directory",record)).get("id").asLong();
        assertThat(tree(member.get("/api/alumni?classNo=62")).get("total").asInt()).isEqualTo(1);
        record.put("consentConfirmed",true); admin.send("PUT","/api/admin/directory/"+id,record);
        assertThat(tree(member.get("/api/alumni?classNo=62")).get("items")).anySatisfy(row->assertThat(row.get("registered").asBoolean()).isFalse());
        record.put("userId",users.findByUsername("member62").orElseThrow().getId());
        assertThat(admin.send("PUT","/api/admin/directory/"+id,record).statusCode()).isEqualTo(400);
        record.put("name","테스트동문");
        assertThat(admin.send("PUT","/api/admin/directory/"+id,record).statusCode()).isEqualTo(200);
        assertThat(tree(member.get("/api/alumni?classNo=62")).get("total").asInt()).isEqualTo(1);
        assertThat(member.send("POST","/api/admin/directory",record).statusCode()).isEqualTo(403);
    }
    long roster(String name,int classNo,String region) {
        return db.queryForObject("INSERT INTO alumni_records(name,class_no,graduation_year,hometown,source_note,consent_confirmed) VALUES (?,?,?,?,?,true) RETURNING id",
            Long.class,name,classNo,GraduationYears.forClass(classNo),region,"가상 명부 / 테스트 동의");
    }
    long memberId(String username) { return users.findByUsername(username).orElseThrow().getId(); }
    @Test void signupAutoLinksExactlyOneMatchWithoutChangingConsentRoleOrPrivateData() throws Exception {
        long id=roster("테스트동문",62,"가상마을");
        var browser=new Browser(); browser.signup("member62",false);
        assertThat(db.queryForObject("SELECT user_id FROM alumni_records WHERE id=?",Long.class,id)).isEqualTo(memberId("member62"));
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_link_reviews",Long.class)).isZero();
        assertThat(users.findByUsername("member62").orElseThrow().getRole()).isEqualTo(MemberRole.MEMBER);
        assertThat(tree(browser.get("/api/alumni?classNo=62")).get("total").asInt()).isZero();
        assertThat(browser.get("/api/auth/me").body()).doesNotContain("가상마을","hometown","source_note");
        browser.send("PATCH","/api/account/preferences",Map.of("directoryAgreed",true,"smsAgreed",false,"emailAgreed",false));
        var result=tree(browser.get("/api/alumni?classNo=62"));
        assertThat(result.get("total").asInt()).isEqualTo(1);
        assertThat(result.get("items").get(0).get("registered").asBoolean()).isTrue();
        assertThat(result.toString()).doesNotContain("hometown","source_note","user_id");
        assertThat(db.queryForObject("SELECT action FROM admin_audit",String.class)).isEqualTo("AUTO_LINK_DIRECTORY");
        seed("editor",MemberRole.ADMIN); var admin=new Browser(); admin.login("editor");
        var stale=Map.of("name","테스트동문","classNo",62,"sourceNote","가상 명부","consentConfirmed",true,"expectedUserId",0);
        assertThat(admin.send("PUT","/api/admin/directory/"+id,stale).statusCode()).isEqualTo(409);
        assertThat(db.queryForObject("SELECT user_id FROM alumni_records WHERE id=?",Long.class,id)).isEqualTo(memberId("member62"));
    }
    @Test void signupDoesNotMatchAnotherNameOrClassOrOverwriteAnOccupiedRecord() throws Exception {
        long otherName=roster("가상다른이름",62,"가상지역");
        long otherClass=roster("테스트동문",61,"가상지역");
        var first=new Browser(); first.signup("firstmember",false);
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_records WHERE user_id IS NOT NULL",Long.class)).isZero();
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_link_reviews",Long.class)).isZero();
        long matching=roster("테스트동문",62,"가상마을");
        var second=new Browser(); second.signup("secondmember",false);
        assertThat(db.queryForObject("SELECT reason FROM alumni_link_reviews WHERE user_id=?",String.class,memberId("secondmember"))).isEqualTo("MULTIPLE_MEMBERS");
        assertThat(db.queryForObject("SELECT user_id FROM alumni_records WHERE id=?",Long.class,matching)).isNull();
        db.update("UPDATE alumni_records SET user_id=? WHERE id=?",memberId("firstmember"),matching);
        var third=new Browser(); third.signup("thirdmember",false);
        assertThat(db.queryForObject("SELECT reason FROM alumni_link_reviews WHERE user_id=?",String.class,memberId("thirdmember"))).isEqualTo("RECORD_IN_USE");
        assertThat(db.queryForObject("SELECT user_id FROM alumni_records WHERE id=?",Long.class,matching)).isEqualTo(memberId("firstmember"));
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_records WHERE id IN (?,?) AND user_id IS NULL",Long.class,otherName,otherClass)).isEqualTo(2);
    }
    @Test void ambiguousSignupIsReviewedByAdminsOnlyWithCsrfAndFreshCandidateChecks() throws Exception {
        long first=roster("테스트동문",62,"가상마을가"), second=roster("테스트동문",62,"가상마을나");
        long wrong=roster("테스트동문",61,"가상마을다");
        var member=new Browser(); member.signup("member62",false);
        long userId=memberId("member62"); String path="/api/admin/directory-links/"+userId;
        assertThat(db.queryForObject("SELECT reason FROM alumni_link_reviews WHERE user_id=?",String.class,userId)).isEqualTo("MULTIPLE_RECORDS");
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_records WHERE user_id IS NOT NULL",Long.class)).isZero();
        assertThat(new Browser().get("/api/admin/directory-links").statusCode()).isEqualTo(401);
        assertThat(new Browser().send("POST",path,Map.of("decision","LINK","recordId",first)).statusCode()).isEqualTo(401);
        for (String role:List.of("MEMBER","PENDING")) {
            db.update("UPDATE users SET role=? WHERE id=?",role,userId);
            assertThat(member.get("/api/admin/directory-links").statusCode()).isEqualTo(403);
            assertThat(member.get(path).statusCode()).isEqualTo(403);
            assertThat(member.send("POST",path,Map.of("decision","LINK","recordId",first)).statusCode()).isEqualTo(403);
        }
        seed("editor",MemberRole.ADMIN); var admin=new Browser(); admin.login("editor");
        var list=tree(admin.get("/api/admin/directory-links"));
        assertThat(list.get("total").asInt()).isEqualTo(1);
        assertThat(list.get("items").get(0).get("candidate_count").asInt()).isEqualTo(2);
        assertThat(tree(admin.get(path)).get("candidates").size()).isEqualTo(2);
        assertThat(admin.get(path).body()).contains("가상마을가","가상마을나").doesNotContain("password","email","phone","source_note");
        assertThat(admin.get("/api/admin/directory-links?status=bad").statusCode()).isEqualTo(400);
        assertThat(admin.request("POST",path,Map.of("decision","LINK","recordId",first),false).statusCode()).isEqualTo(403);
        assertThat(admin.send("POST",path,Map.of("decision","LINK")).statusCode()).isEqualTo(400);
        assertThat(admin.send("POST",path,Map.of("decision","LINK","recordId",wrong)).statusCode()).isEqualTo(409);
        assertThat(admin.send("POST",path,Map.of("decision","LINK","recordId",second)).statusCode()).isEqualTo(204);
        assertThat(db.queryForObject("SELECT user_id FROM alumni_records WHERE id=?",Long.class,second)).isEqualTo(userId);
        assertThat(db.queryForObject("SELECT status FROM alumni_link_reviews WHERE user_id=?",String.class,userId)).isEqualTo("LINKED");
        assertThat(tree(admin.get("/api/admin/directory-links")).get("total").asInt()).isZero();
        assertThat(tree(admin.get("/api/admin/directory-links?status=LINKED")).get("total").asInt()).isEqualTo(1);
        assertThat(admin.send("POST",path,Map.of("decision","LINK","recordId",first)).statusCode()).isEqualTo(409);
        var secondMember=new Browser(); secondMember.signup("secondmember",false);
        assertThat(db.queryForObject("SELECT reason FROM alumni_link_reviews WHERE user_id=?",String.class,memberId("secondmember"))).isEqualTo("MULTIPLE_RECORDS");
        assertThat(db.queryForObject("SELECT user_id FROM alumni_records WHERE id=?",Long.class,first)).isNull();
        assertThat(admin.send("POST","/api/admin/directory-links/"+memberId("secondmember"),Map.of("decision","LINK","recordId",second)).statusCode()).isEqualTo(409);
    }
    @Test void dismissedReviewsAndManualLinksStayConsistentAndWithdrawalClearsReview() throws Exception {
        long first=roster("테스트동문",62,"가상마을가"); roster("테스트동문",62,"가상마을나");
        seed("owner",MemberRole.SUPER_ADMIN); var admin=new Browser(); admin.login("owner");
        var member=new Browser(); member.signup("member62",false); long userId=memberId("member62");
        String path="/api/admin/directory-links/"+userId;
        assertThat(admin.send("POST",path,Map.of("decision","DISMISS")).statusCode()).isEqualTo(204);
        assertThat(tree(admin.get("/api/admin/directory-links?status=DISMISSED")).get("total").asInt()).isEqualTo(1);
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_records WHERE user_id IS NOT NULL",Long.class)).isZero();
        var record=new HashMap<String,Object>(Map.of("name","테스트동문","classNo",62,"sourceNote","가상 명부 / 테스트 확인","consentConfirmed",true,"userId",userId));
        assertThat(admin.send("PUT","/api/admin/directory/"+first,record).statusCode()).isEqualTo(200);
        assertThat(db.queryForObject("SELECT status FROM alumni_link_reviews WHERE user_id=?",String.class,userId)).isEqualTo("LINKED");
        record.remove("userId");
        assertThat(admin.send("PUT","/api/admin/directory/"+first,record).statusCode()).isEqualTo(200);
        assertThat(db.queryForObject("SELECT status FROM alumni_link_reviews WHERE user_id=?",String.class,userId)).isEqualTo("DISMISSED");
        assertThat(member.send("DELETE","/api/account",Map.of("password",PASSWORD)).statusCode()).isEqualTo(204);
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_link_reviews",Long.class)).isZero();
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_records",Long.class)).isEqualTo(2);
    }
    @Test void simultaneousSignupsClaimOneRecordOnly() throws Exception {
        long id=roster("테스트동문",62,"가상마을");
        try (var executor=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var start=new java.util.concurrent.CountDownLatch(1);
            var requests=List.of("firstmember","secondmember").stream().map(username->executor.submit(()->{
                start.await(); return new Browser().send("POST","/api/auth/signup",signupBody(username,false)).statusCode();
            })).toList();
            start.countDown();
            for (var request:requests) assertThat(request.get(30,java.util.concurrent.TimeUnit.SECONDS)).isEqualTo(200);
        }
        assertThat(db.queryForObject("SELECT user_id FROM alumni_records WHERE id=?",Long.class,id)).isNotNull();
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_link_reviews WHERE status='PENDING'",Long.class)).isEqualTo(1);
        assertThat(db.queryForObject("SELECT count(*) FROM users",Long.class)).isEqualTo(2);
    }
    @Test void simultaneousReviewDecisionsCannotClaimTheSameRecord() throws Exception {
        long id=roster("테스트동문",62,"가상마을가"); roster("테스트동문",62,"가상마을나");
        new Browser().signup("firstmember",false); new Browser().signup("secondmember",false);
        seed("editor",MemberRole.ADMIN); seed("owner",MemberRole.SUPER_ADMIN);
        var first=new Browser(); first.login("editor"); var second=new Browser(); second.login("owner");
        try (var executor=java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var start=new java.util.concurrent.CountDownLatch(1);
            long firstId=memberId("firstmember"),secondId=memberId("secondmember");
            var one=executor.submit(()->{ start.await(); return first.send("POST","/api/admin/directory-links/"+firstId,Map.of("decision","LINK","recordId",id)).statusCode(); });
            var two=executor.submit(()->{ start.await(); return second.send("POST","/api/admin/directory-links/"+secondId,Map.of("decision","LINK","recordId",id)).statusCode(); });
            start.countDown();
            assertThat(List.of(one.get(30,java.util.concurrent.TimeUnit.SECONDS),two.get(30,java.util.concurrent.TimeUnit.SECONDS))).containsExactlyInAnyOrder(204,409);
        }
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_link_reviews WHERE status='LINKED'",Long.class)).isEqualTo(1);
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_link_reviews WHERE status='PENDING'",Long.class)).isEqualTo(1);
    }
    @Test void reviewMigrationQueuesExistingMatchesWithoutChangingExistingLinksOrConsent() {
        Flyway.configure().dataSource(postgres.getJdbcUrl(),postgres.getUsername(),postgres.getPassword())
            .schemas("link_upgrade").defaultSchema("link_upgrade").target("4").load().migrate();
        try {
            for (int n=1;n<=4;n++) db.update("INSERT INTO link_upgrade.users(id,username,password_hash,name,email,class_no,role,terms_agreed,privacy_agreed,sms_agreed,email_agreed,enabled,created_at) VALUES (?,?, 'hash',?,?,62,'MEMBER',true,true,false,false,true,now())",
                n,"synthetic"+n,"가상회원"+n,"synthetic"+n+"@example.invalid");
            db.update("INSERT INTO link_upgrade.alumni_records(name,class_no,source_note,consent_confirmed,user_id) VALUES ('가상회원1',62,'synthetic',false,NULL),('가상회원2',62,'synthetic',true,NULL),('가상회원2',62,'synthetic',true,NULL),('가상회원3',62,'synthetic',false,3)");
            Flyway.configure().dataSource(postgres.getJdbcUrl(),postgres.getUsername(),postgres.getPassword())
                .schemas("link_upgrade").defaultSchema("link_upgrade").load().migrate();
            assertThat(db.queryForList("SELECT user_id FROM link_upgrade.alumni_link_reviews ORDER BY user_id",Long.class)).containsExactly(1L,2L);
            assertThat(db.queryForObject("SELECT reason FROM link_upgrade.alumni_link_reviews WHERE user_id=1",String.class)).isEqualTo("EXISTING_MEMBER");
            assertThat(db.queryForObject("SELECT reason FROM link_upgrade.alumni_link_reviews WHERE user_id=2",String.class)).isEqualTo("MULTIPLE_RECORDS");
            assertThat(db.queryForObject("SELECT count(*) FROM link_upgrade.alumni_records WHERE user_id IS NOT NULL",Long.class)).isEqualTo(1);
            assertThat(db.queryForObject("SELECT count(*) FROM link_upgrade.alumni_records WHERE NOT consent_confirmed",Long.class)).isEqualTo(2);
        } finally { db.execute("DROP SCHEMA link_upgrade CASCADE"); }
    }
    @Test void boardPermissionsOwnershipAndOptimisticUpdates() throws Exception {
        seed("editor",MemberRole.ADMIN); var admin=new Browser(); admin.login("editor");
        var first=new Browser(); first.signup("member62",false);
        var second=new Browser(); second.signup("member63",false);
        for(String board:List.of("announcements","events","gallery","affairs")){
            assertThat(first.send("POST","/api/boards/"+board+"/posts",post(board,0)).statusCode()).isEqualTo(403);
            assertThat(admin.send("POST","/api/boards/"+board+"/posts",post(board,0)).statusCode()).isEqualTo(201);
        }
        long id=tree(first.send("POST","/api/boards/free/posts",post("free board",0))).get("id").asLong();
        String path="/api/boards/free/posts/"+id;
        assertThat(second.send("PUT",path,post("stolen",0)).statusCode()).isEqualTo(403);
        assertThat(second.send("DELETE",path+"?version=0",null).statusCode()).isEqualTo(403);
        assertThat(first.send("PUT",path,post("updated",0)).statusCode()).isEqualTo(200);
        assertThat(first.send("PUT",path,post("stale",0)).statusCode()).isEqualTo(409);
        assertThat(new Browser().get(path).statusCode()).isEqualTo(200);
        assertThat(first.get("/api/boards/events/posts/"+id).statusCode()).isEqualTo(404);
        assertThat(admin.send("DELETE",path+"?version=1",null).statusCode()).isEqualTo(204);
        assertThat(first.get(path).statusCode()).isEqualTo(404);
        db.update("UPDATE users SET role='PENDING' WHERE username='member62'");
        assertThat(first.send("POST","/api/boards/free/posts",post("legacy pending member",0)).statusCode()).isEqualTo(201);
    }
    @Test void directorySourceDetailsRemainPrivateAndSurviveLegacyUpdates() throws Exception {
        seed("editor",MemberRole.ADMIN); var admin=new Browser(); admin.login("editor");
        var member=new Browser(); member.signup("member62",false);
        var record=new HashMap<String,Object>();
        record.put("name","가상자료"); record.put("classNo",20); record.put("sourceNote","가상 명부 / 테스트 동의");
        record.put("consentConfirmed",true); record.put("hometown","가상마을"); record.put("graduationYear",1947);
        var response=admin.send("POST","/api/admin/directory",record);
        assertThat(response.statusCode()).isEqualTo(201);
        long id=tree(response).get("id").asLong();
        db.update("INSERT INTO alumni_import_keys(source_key,record_id) VALUES (?,?)","synthetic:20:0001",id);
        var managed=tree(admin.get("/api/admin/directory?classNo=20")).get("items").get(0);
        assertThat(managed.get("hometown").asText()).isEqualTo("가상마을");
        assertThat(managed.get("graduation_year").asInt()).isEqualTo(1947);
        var result=tree(member.get("/api/alumni?classNo=20"));
        assertThat(result.get("items").get(0).get("graduation_year").asInt()).isEqualTo(1947);
        assertThat(result.toString()).doesNotContain("hometown","source_note","source_key","가상마을");
        assertThat(new Browser().get("/api/alumni?classNo=20").statusCode()).isEqualTo(401);
        record.remove("hometown"); record.remove("graduationYear");
        assertThat(admin.send("PUT","/api/admin/directory/"+id,record).statusCode()).isEqualTo(200);
        assertThat(db.queryForObject("SELECT hometown FROM alumni_records WHERE id=?",String.class,id)).isEqualTo("가상마을");
        assertThat(db.queryForObject("SELECT graduation_year FROM alumni_records WHERE id=?",Integer.class,id)).isEqualTo(1947);
        record.put("hometown",""); record.put("consentConfirmed",false);
        assertThat(admin.send("PUT","/api/admin/directory/"+id,record).statusCode()).isEqualTo(200);
        assertThat(db.queryForObject("SELECT hometown FROM alumni_records WHERE id=?",String.class,id)).isNull();
        assertThat(tree(member.get("/api/alumni?classNo=20")).get("total").asInt()).isZero();
        record.put("graduationYear",2100);
        assertThat(admin.send("PUT","/api/admin/directory/"+id,record).statusCode()).isEqualTo(400);
        assertThat(admin.send("DELETE","/api/admin/directory/"+id,null).statusCode()).isEqualTo(204);
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_import_keys WHERE source_key='synthetic:20:0001' AND record_id IS NULL",Integer.class)).isEqualTo(1);
    }
    @Test void withdrawalRemovesPrivateInformationAndSessionButPreservesAnonymizedPost() throws Exception {
        var browser=new Browser(); browser.signup("member62",true);
        long postId=tree(browser.send("POST","/api/boards/free/posts",post("public text",0))).get("id").asLong();
        assertThat(browser.send("DELETE","/api/account",Map.of("password","wrong")).statusCode()).isEqualTo(400);
        assertThat(browser.send("DELETE","/api/account",Map.of("password",PASSWORD)).statusCode()).isEqualTo(204);
        assertThat(browser.get("/api/auth/me").statusCode()).isEqualTo(401);
        assertThat(users.count()).isZero(); assertThat(profiles.count()).isZero();
        assertThat(tree(new Browser().get("/api/boards/free/posts/"+postId)).get("author_name").asText()).isEqualTo("탈퇴 회원");
    }
    @Test void uploadsArePrivateUntilPublishedAndCannotBeStolen() throws Exception {
        var author=new Browser(); author.signup("member62",false);
        var other=new Browser(); other.signup("member63",false);
        byte[] png=Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=");
        assertThat(author.upload("<script>alert(1)</script>".getBytes(),"fake.png").statusCode()).isEqualTo(400);
        var response=author.upload(png,"photo.png"); assertThat(response.statusCode()).isEqualTo(201);
        String id=tree(response).get("id").asText(); String path="/api/media/"+id;
        assertThat(new Browser().get(path).statusCode()).isEqualTo(401);
        assertThat(other.get(path).statusCode()).isEqualTo(404);
        var body=new HashMap<String,Object>(post("with photo",0)); body.put("mediaIds",List.of(id));
        assertThat(other.send("POST","/api/boards/free/posts",body).statusCode()).isEqualTo(403);
        assertThat(db.queryForObject("SELECT count(*) FROM board_posts",Long.class)).isZero();
        long postId=tree(author.send("POST","/api/boards/free/posts",body)).get("id").asLong();
        var publicFile=new Browser().get(path);
        assertThat(publicFile.statusCode()).isEqualTo(200);
        assertThat(publicFile.headers().firstValue("content-type")).contains("image/png");
        var range=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path)).header("Range","bytes=0-7").GET().build();
        assertThat(HttpClient.newHttpClient().send(range,HttpResponse.BodyHandlers.ofByteArray()).statusCode()).isEqualTo(206);
        author.send("DELETE","/api/boards/free/posts/"+postId+"?version=0",null);
        assertThat(author.get(path).statusCode()).isEqualTo(404);
    }
    @Test void bootstrapCreatesOnlyOneOwnerAndOwnerCannotBeDemotedOrWithdraw() throws Exception {
        var bootstrap=new kr.or.bongrae.alumni.admin.BootstrapAdmin(users,profiles,passwords,"owner",PASSWORD,"owner@example.invalid");
        bootstrap.run(null); bootstrap.run(null);
        assertThat(users.count()).isEqualTo(1);
        var owner=new Browser(); owner.login("owner");
        long id=users.findByUsername("owner").orElseThrow().getId();
        assertThat(owner.send("PATCH","/api/admin/members/"+id+"/role",Map.of("role","MEMBER")).statusCode()).isEqualTo(409);
        assertThat(owner.send("DELETE","/api/account",Map.of("password",PASSWORD)).statusCode()).isEqualTo(409);
    }
    @Test void legacySchemaBaselineRetainsExistingMembers(){
        db.execute("CREATE SCHEMA legacy_upgrade");
        db.execute("CREATE TABLE legacy_upgrade.users (LIKE public.users INCLUDING ALL)");
        db.execute("CREATE TABLE legacy_upgrade.alumni_profiles (LIKE public.alumni_profiles INCLUDING ALL)");
        for(String column:List.of("terms_version","privacy_version","consented_at","preferences_updated_at","age_confirmed")) db.execute("ALTER TABLE legacy_upgrade.users DROP COLUMN "+column);
        db.execute("ALTER TABLE legacy_upgrade.alumni_profiles DROP COLUMN directory_consent_at");
        db.update("INSERT INTO legacy_upgrade.users(username,password_hash,name,email,role,terms_agreed,privacy_agreed,sms_agreed,email_agreed,enabled,created_at) VALUES ('legacy','hash','테스트기존','legacy@example.invalid','PENDING',true,true,false,false,true,now())");
        db.update("UPDATE legacy_upgrade.users SET class_no=20, graduation_year=1946");
        Flyway.configure().dataSource(postgres.getJdbcUrl(),postgres.getUsername(),postgres.getPassword())
            .schemas("legacy_upgrade").defaultSchema("legacy_upgrade").baselineOnMigrate(true).baselineVersion("0").load().migrate();
        assertThat(db.queryForObject("SELECT username FROM legacy_upgrade.users",String.class)).isEqualTo("legacy");
        assertThat(db.queryForObject("SELECT count(*) FROM legacy_upgrade.flyway_schema_history WHERE success",Long.class)).isEqualTo(6);
        assertThat(db.queryForObject("SELECT graduation_year FROM legacy_upgrade.users",Integer.class)).isEqualTo(1947);
        db.execute("DROP SCHEMA legacy_upgrade CASCADE");
    }
}
