import type { IPage } from "@/services/api/types/pages";

export interface IRequestCopydocPanel {
  isOpen: boolean;
  onClose: () => void;
  webpage?: IPage;
}
