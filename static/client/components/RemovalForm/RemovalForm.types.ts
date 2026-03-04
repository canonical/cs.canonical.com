import type { IPage } from "@/services/api/types/pages";

export interface IRemovalFormProps {
  webpage: IPage;
  onSuccess: () => void;
  onBack?: () => void;
}
