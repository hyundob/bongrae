package kr.or.bongrae.alumni.auth;

import java.net.*;
import java.net.http.*;
import java.util.*;
import com.fasterxml.jackson.databind.*;
import kr.or.bongrae.alumni.member.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.*;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import static org.assertj.core.api.Assertions.*;

@Tag("integration") @Testcontainers
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties="app.signup.enabled=false")
@ActiveProfiles("test")
@DirtiesContext(classMode=DirtiesContext.ClassMode.AFTER_CLASS)
class SignupPausedIntegrationTest {
    @Container static final PostgreSQLContainer<?> postgres=new PostgreSQLContainer<>("postgres:16-alpine").withDatabaseName("signup_pause_harness");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",postgres::getJdbcUrl);
        registry.add("spring.datasource.username",postgres::getUsername);
        registry.add("spring.datasource.password",postgres::getPassword);
    }
    @LocalServerPort int port;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate db;
    @Autowired UserAccountRepository users;
    @Autowired AlumniProfileRepository profiles;
    @Autowired PasswordEncoder passwords;
    static final String PASSWORD="synthetic-password-62";
    @BeforeEach void clear() { db.execute("TRUNCATE users, spring_session CASCADE"); }

    class Browser {
        final HttpClient client=HttpClient.newBuilder().cookieHandler(new CookieManager(null,CookiePolicy.ACCEPT_ALL)).build();
        HttpResponse<String> get(String path) throws Exception { return request("GET",path,null,false); }
        HttpResponse<String> request(String method,String path,Object body,boolean csrf) throws Exception {
            var builder=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path));
            if (csrf) {
                var token=json.readTree(get("/api/auth/csrf").body());
                builder.header(token.get("headerName").asText(),token.get("token").asText());
            }
            if (body!=null) builder.header("Content-Type","application/json");
            return client.send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build(),HttpResponse.BodyHandlers.ofString());
        }
    }
    SignupRequest signup() {
        return new SignupRequest("newmember",PASSWORD,PASSWORD,"가상신규동문","newmember@example.invalid","010-0000-0062",
            null,null,62,true,true,false,false,false,true,AuthService.POLICY_VERSION);
    }
    void assertPaused(Browser browser) throws Exception {
        var response=browser.request("POST","/api/auth/signup",signup(),true);
        assertThat(response.statusCode()).isEqualTo(503);
        assertThat(json.readTree(response.body()).get("code").asText()).isEqualTo("SIGNUP_PAUSED");
        assertThat(response.headers().firstValue("cache-control").orElse("")).contains("no-store");
    }
    @Test void statusIsPublicUncachedAndSignupIsDeniedWithoutChangingRosterOrAccounts() throws Exception {
        db.update("INSERT INTO alumni_records(name,class_no,source_note,consent_confirmed) VALUES ('가상신규동문',62,'synthetic',true)");
        var before=db.queryForList("SELECT * FROM alumni_records");
        var browser=new Browser();
        var status=browser.get("/api/auth/registration");
        assertThat(status.statusCode()).isEqualTo(200);
        assertThat(json.readTree(status.body()).get("enabled").asBoolean()).isFalse();
        assertThat(status.headers().firstValue("cache-control").orElse("")).contains("no-store");
        assertPaused(browser);
        assertThat(browser.request("POST","/api/auth/signup",signup(),false).statusCode()).isEqualTo(403);
        assertThat(browser.request("POST","/api/auth/registration",Map.of("enabled",true),true).statusCode()).isEqualTo(401);
        assertThat(users.count()).isZero(); assertThat(profiles.count()).isZero();
        assertThat(db.queryForList("SELECT * FROM alumni_records")).isEqualTo(before);
        assertThat(db.queryForObject("SELECT count(*) FROM alumni_link_reviews",Long.class)).isZero();
        assertThat(browser.get("/api/auth/me").statusCode()).isEqualTo(401);
        assertThat(browser.get("/api/boards/free/posts").statusCode()).isEqualTo(200);
    }
    @Test void existingMemberPendingAndAdminLoginsKeepTheirPermissionsWhileSignupStaysPaused() throws Exception {
        int number=0;
        for (var role:List.of(MemberRole.MEMBER,MemberRole.PENDING,MemberRole.ADMIN,MemberRole.SUPER_ADMIN)) {
            String username="existing"+(++number);
            var user=new UserAccount(username,passwords.encode(PASSWORD),"가상기존동문",username+"@example.invalid",null,null,null,62,true,true,false,false);
            user.changeRole(role); users.saveAndFlush(user); profiles.saveAndFlush(new AlumniProfile(user));
            var browser=new Browser();
            assertThat(browser.request("POST","/api/auth/login",Map.of("username",username,"password",PASSWORD),true).statusCode()).isEqualTo(200);
            assertThat(json.readTree(browser.get("/api/auth/me").body()).get("role").asText()).isEqualTo(role.name());
            assertPaused(browser);
            assertThat(browser.get("/api/admin/members").statusCode()).isEqualTo(role==MemberRole.ADMIN||role==MemberRole.SUPER_ADMIN?200:403);
            assertThat(browser.request("POST","/api/auth/logout",null,true).statusCode()).isEqualTo(204);
            assertThat(browser.get("/api/auth/me").statusCode()).isEqualTo(401);
        }
        assertThat(users.count()).isEqualTo(4);
    }
    @Test void bootstrapAdministratorIsNotBlockedByPublicSignupPause() throws Exception {
        new kr.or.bongrae.alumni.admin.BootstrapAdmin(users,profiles,passwords,"testowner",PASSWORD,"owner@example.invalid").run(null);
        assertThat(users.count()).isEqualTo(1);
        var browser=new Browser();
        assertThat(browser.request("POST","/api/auth/login",Map.of("username","testowner","password",PASSWORD),true).statusCode()).isEqualTo(200);
        assertThat(browser.get("/api/admin/members").statusCode()).isEqualTo(200);
        assertPaused(browser);
    }
}
