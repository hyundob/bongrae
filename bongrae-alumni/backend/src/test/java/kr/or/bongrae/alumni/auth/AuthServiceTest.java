package kr.or.bongrae.alumni.auth;
import java.util.Optional;
import kr.or.bongrae.alumni.member.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserAccountRepository users;
    @Mock AlumniProfileRepository profiles;
    private final BCryptPasswordEncoder passwords=new BCryptPasswordEncoder(4);
    private AuthService service;
    @BeforeEach void setup(){service=new AuthService(users,profiles,passwords);}
    @Test void signupHashesPasswordAndKeepsDirectoryPrivate(){
        var user=service.signup(request());
        verify(users).saveAndFlush(user);
        assertThat(passwords.matches(request().password(),user.getPasswordHash())).isTrue();
        assertThat(user.getRole()).isEqualTo(MemberRole.MEMBER);
        assertThat(user.getGraduationYear()).isEqualTo(1988);
        assertThat(user.getTermsVersion()).isEqualTo(AuthService.POLICY_VERSION);
        var profile=ArgumentCaptor.forClass(AlumniProfile.class);
        verify(profiles).save(profile.capture());
        assertThat(profile.getValue().isPublicProfile()).isFalse();
    }
    @Test void duplicateUsernameRejected(){
        when(users.findByUsernameIgnoreCase("member62")).thenReturn(Optional.of(mock(UserAccount.class)));
        assertRejected();
    }
    @Test void duplicateEmailRejected(){
        when(users.existsByEmailIgnoreCase("member@example.invalid")).thenReturn(true);
        assertRejected();
    }
    @Test void unknownLoginRejected(){assertThatThrownBy(()->service.login(new LoginRequest("missing","wrong"))).isInstanceOf(ResponseStatusException.class);}
    @Test void wrongPasswordRejected(){
        var user=new UserAccount("member",passwords.encode("correct-password"),"Test Member","member@example.invalid",null,null,null,62,true,true,false,false);
        when(users.findByUsernameIgnoreCase("member")).thenReturn(Optional.of(user));
        assertThatThrownBy(()->service.login(new LoginRequest("member","wrong"))).isInstanceOf(ResponseStatusException.class);
    }
    void assertRejected(){
        assertThatThrownBy(()->service.signup(request())).isInstanceOfSatisfying(ResponseStatusException.class,e->assertThat(e.getStatusCode().value()).isEqualTo(409));
        verify(users,never()).saveAndFlush(any()); verifyNoInteractions(profiles);
    }
    SignupRequest request(){return new SignupRequest("member62","test-password-62","test-password-62","Test Member","member@example.invalid","010-0000-0062","전라남도","고흥군",62,true,true,false,false,false,true,AuthService.POLICY_VERSION);}
}
