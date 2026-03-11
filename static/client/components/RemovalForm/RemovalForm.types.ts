import type { IPage } from "@/services/api/types/pages";

export interface IRemovalFormProps {
  webpage: IPage;
  onSuccess: () => void;
  onLoadingChange?: (loading: boolean) => void;
}
