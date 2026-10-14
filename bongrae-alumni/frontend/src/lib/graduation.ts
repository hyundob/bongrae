// The school register goes from class 2 (1928) to class 3 (1930).
export function graduationYear(classNo: number) {
  return classNo + (classNo <= 2 ? 1926 : 1927);
}

export function latestGraduatingClass() {
  return new Date().getFullYear() - 1927;
}
