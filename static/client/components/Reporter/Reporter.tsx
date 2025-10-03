import { useCallback, type ReactNode } from "react";

import type { IReporterProps } from "./Reporter.types";

import CustomSearchAndFilter from "@/components/Common/CustomSearchAndFilter";
import { useUsers } from "@/services/api/hooks/users";
import { type IUser } from "@/services/api/types/users";
import { useStore } from "@/store";

const Reporter = ({ reporter, setReporter }: IReporterProps): ReactNode => {
  const user = useStore((state) => state.user);
  const { data, isLoading } = useUsers();

  const handleRemoveReporter = useCallback(
    () => () => {
      setReporter(user);
    },
    [setReporter, user],
  );

  const handleSelectReporter = useCallback(
    (option: IUser) => {
      setReporter(option);
    },
    [setReporter],
  );

  return (
    <CustomSearchAndFilter<IUser>
      label="Reporter"
      loading={!!isLoading}
      onRemove={handleRemoveReporter}
      onSelect={handleSelectReporter}
      options={data || []}
      placeholder="Select a reporter"
      selectedOptions={reporter ? [reporter] : []}
    />
  );
};

export default Reporter;
