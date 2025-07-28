import type { IPage } from "@/services/api/types/pages";
import type { IUser } from "@/services/api/types/users";

export interface IReviewersProps {
  page?: IPage;
  onSelectOwner?: (owner: IUser | null) => void;
  onSelectReviewers?: (reviewers: IUser[]) => void;
}
