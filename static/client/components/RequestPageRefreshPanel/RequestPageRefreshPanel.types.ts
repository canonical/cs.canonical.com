import type { IPage } from "@/services/api/types/pages";

export interface IRequestPageRefreshPanel {
  isOpen: boolean;
  onClose: () => void;
  webpage?: IPage;
}
