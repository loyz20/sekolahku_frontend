export function hasDuty(duties: string[] | undefined, duty: string) {
  return Array.isArray(duties) && duties.includes(duty);
}

export function isSuperadmin(duties: string[] | undefined) {
  return hasDuty(duties, "superadmin");
}

export function isAdminLike(duties: string[] | undefined) {
  return hasDuty(duties, "admin") || hasDuty(duties, "superadmin");
}

export function isTeacherOnly(duties: string[] | undefined) {
  return hasDuty(duties, "guru") && !isAdminLike(duties);
}
