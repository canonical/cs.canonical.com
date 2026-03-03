import type { IJiraTask } from "@/services/api/types/pages";

export interface IJiraTasksProps {
  tasks: IJiraTask[];
  isWebPage?: boolean;
}
