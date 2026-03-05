import type { IPage } from "@/services/api/types/pages";

export interface IRemovalFormProps {
  webpage: IPage;
  onSuccess: () => void;
  onActionsReady: (actions: { onSubmit: () => void; loading: boolean }) => void;
}
