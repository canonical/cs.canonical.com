import { useCallback, type ReactNode } from "react";

import type { IReporterProps } from "./Reporter.types";

import CustomSearchAndFilter from "@/components/Common/CustomSearchAndFilter";
import { useUsersRequest } from "@/hooks/useUsersRequest";
import { type IUser } from "@/services/api/types/users";
import { useStore } from "@/store";

const Reporter = ({ reporter, setReporter }: IReporterProps): ReactNode => {
  const user = useStore((state) => state.user);
  const { options, setOptions, handleChange } = useUsersRequest();

  const handleRemoveReporter = useCallback(
    () => () => {
      setReporter(user);
    },
    [setReporter, user],
  );

  const handleSelectReporter = useCallback(
    (option: IUser) => {
      setOptions([]);
      setReporter(option);
    },
    [setOptions, setReporter],
  );

  return (
    <CustomSearchAndFilter<IUser>
      label="Reporter"
      onChange={handleChange}
      onRemove={handleRemoveReporter}
      onSelect={handleSelectReporter}
      options={options}
      placeholder="Select a reporter"
      selectedOptions={reporter ? [reporter] : []}
    />
  );
};

export default Reporter;
