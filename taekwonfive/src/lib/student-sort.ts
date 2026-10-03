import type { Student } from "@/types/student";

function rankNumber(value: string | null, suffix: "품" | "급"): number | null {
  const match = new RegExp(`^(\\d+)\\s*${suffix}?$`).exec(value?.trim() ?? "");
  if (!match) return null;
  const rank = Number(match[1]);
  return Number.isSafeInteger(rank) ? rank : null;
}

const KUKKIWON = "국기원";

/** 품 순위: 숫자가 클수록 높고, 국기원은 숫자 품보다 낮다(품 중 가장 낮음).
 * 그 외(미상, 색띠 표기 등)는 국기원보다도 낮다. */
function poomRank(value: string | null): number {
  if (value?.trim() === KUKKIWON) return 0;
  return rankNumber(value, "품") ?? -1;
}

/** 급 순위: 국기원이 가장 높고, 그다음 숫자가 작을수록 높다. 그 외(미상)는 가장 낮다. */
function gradeRank(value: string | null): number {
  if (value?.trim() === KUKKIWON) return -Infinity;
  return rankNumber(value, "급") ?? Infinity;
}

/** 품이 높은 순으로 먼저 정렬한다(국기원은 품 중 가장 낮음). 품이 같으면
 * 급이 낮은 순으로 정렬한다(국기원은 급 중 가장 높음). 그래도 같으면
 * 이름, 그다음 ID 순. */
export function compareStudentsByRank(a: Student, b: Student): number {
  const aPoom = poomRank(a.poom);
  const bPoom = poomRank(b.poom);
  if (aPoom !== bPoom) return bPoom - aPoom;

  const aGrade = gradeRank(a.grade);
  const bGrade = gradeRank(b.grade);
  if (aGrade !== bGrade) return aGrade - bGrade;

  return a.name.localeCompare(b.name, "ko") || a.id.localeCompare(b.id, "en", { numeric: true });
}

export function sortStudentsByRank(students: Student[]): Student[] {
  return [...students].sort(compareStudentsByRank);
}
