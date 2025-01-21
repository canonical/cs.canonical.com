import type { IUser } from "@/services/api/types/users";

export interface IReporterProps {
  reporter: IUser | null;
  setReporter: React.Dispatch<React.SetStateAction<IUser>>;
}
