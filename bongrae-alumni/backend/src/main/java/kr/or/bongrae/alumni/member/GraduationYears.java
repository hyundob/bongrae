package kr.or.bongrae.alumni.member;

import java.time.Year;

public final class GraduationYears {
    private GraduationYears() {}

    public static int forClass(int classNo) {
        return classNo + (classNo <= 2 ? 1926 : 1927);
    }

    public static int latestClass() {
        return Year.now().getValue() - 1927;
    }
}
