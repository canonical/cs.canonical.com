import type { ChangeRequestType, IPage } from "@/services/api/types/pages";

export interface IRequestCopydocPanel {
  changeType: (typeof ChangeRequestType)[keyof typeof ChangeRequestType];
  isOpen: boolean;
  onClose: () => void;
  webpage?: IPage;
}