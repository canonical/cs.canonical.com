import React, { useEffect, useState, memo, useCallback, useMemo, type ReactNode } from "react";

import { SearchBox, Input } from "@canonical/react-components";

import { useUsers } from "@/services/api/hooks/users";
import type { IUser } from "@/services/api/types/users";

type SearchUserCheckboxProps<T extends string[]> = {
  state: T;
  setState: React.Dispatch<React.SetStateAction<T>>;
};

function SearchUserCheckbox<T extends string[]>({ state, setState }: SearchUserCheckboxProps<T>): ReactNode {
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [searchedUsers, setSearchedUsers] = useState<IUser[]>([]);

  const { data } = useUsers();

  useEffect(() => {
    const fetchUsers = async () => {
      const users = data;
      if (users?.data?.length) {
        const userData = users.data;
        setAllUsers([...userData]);
        setSearchedUsers([...userData]);
      }
    };

    fetchUsers();
  }, [data]);

  const searchUsers = useCallback(
    (s: string): void => {
      if (s.length >= 2) {
        const filteredUsers = allUsers.filter((user) => user.name.toLowerCase().includes(s.toLowerCase()));
        setSearchedUsers(filteredUsers);
      } else {
        setSearchedUsers([...allUsers]);
      }
    },
    [allUsers],
  );

  const handleCheckboxChange = useCallback(
    (user: IUser) => {
      if (state.includes(user.email)) {
        setState((prevState) => prevState.filter((email) => email !== user.email) as T);
      } else {
        setState((prevState) => [...prevState, user.email] as T);
      }
    },
    [state, setState],
  );

  const sortedUsers = useMemo(() => {
    return [...searchedUsers].sort((a, b) => {
      const aChecked = state.includes(a.email);
      const bChecked = state.includes(b.email);

      if (aChecked !== bChecked) {
        return aChecked ? -1 : 1; // Checked users come first
      }

      // If both are either checked or unchecked, sort by name
      return a.name.localeCompare(b.name);
    });
  }, [searchedUsers, state]);

  return (
    <div className="u-sv3">
      <SearchBox className="filter-search" onChange={searchUsers} />
      <div className="u-sv3 p-filter__group">
        {sortedUsers.map((user) => (
          <Input
            checked={state.includes(user.email)}
            key={user.id}
            label={user.name}
            onChange={() => handleCheckboxChange(user)}
            type="checkbox"
          />
        ))}
      </div>
    </div>
  );
}

export default memo(SearchUserCheckbox) as typeof SearchUserCheckbox;
