import type { IPage } from "@/services/api/types/pages";
import type { IUser } from "@/services/api/types/users";

export const canActOnPage = (user: IUser | null | undefined, page: IPage): boolean => {
  if (!user?.email) return false;
  if (user.role === "admin") return true;
  if (page.owner?.email === user.email) return true;
  return !!page.reviewers?.some((r) => r.email === user.email);
};
