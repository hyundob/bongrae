package kr.or.bongrae.alumni.member;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class GraduationYearsTest {
    @Test void followsTheSourceRegisterIncludingThe1929Gap() {
        assertThat(GraduationYears.forClass(1)).isEqualTo(1927);
        assertThat(GraduationYears.forClass(2)).isEqualTo(1928);
        assertThat(GraduationYears.forClass(3)).isEqualTo(1930);
        assertThat(GraduationYears.forClass(20)).isEqualTo(1947);
        assertThat(GraduationYears.forClass(62)).isEqualTo(1989);
        assertThat(GraduationYears.forClass(97)).isEqualTo(2024);
    }
}
