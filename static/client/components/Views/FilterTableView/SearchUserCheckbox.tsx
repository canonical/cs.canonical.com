import React, { useEffect, useState, memo } from "react";

import { SearchBox, Input } from "@canonical/react-components";

import { UsersServices } from "@/services/api/services/users";
import type { IUser } from "@/services/api/types/users";

type SearchUserCheckboxProps<T extends string | string[]> = {
  state: T;
  setState: React.Dispatch<React.SetStateAction<T>>;
};

function SearchUserCheckbox<T extends string | string[]>({ state, setState }: SearchUserCheckboxProps<T>): JSX.Element {
  const [allUsers, setAllUsers] = useState<IUser[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await UsersServices.getUsers("");
      if (users?.data?.length) {
        const userData = users.data;
        setAllUsers([...userData]);
        setSearchedUsers([...userData]);
      }
    };

    fetchUsers();
  }, []);

  const [searchedUsers, setSearchedUsers] = useState<IUser[]>([]);
  return (
    <div className="u-sv3">
      <SearchBox
        className="filter-search"
        onChange={(s: string) => {
          if (s.length >= 2) {
            const filteredUsers = allUsers.filter((user) => user.name.toLowerCase().includes(s.toLowerCase()));
            setSearchedUsers(filteredUsers);
          } else {
            setSearchedUsers([...allUsers]);
          }
        }}
      />
      <div className="u-sv3 p-filter__group">
        {searchedUsers.map((user) => (
          <Input
            checked={Array.isArray(state) ? state.includes(user.email) : state === user.email}
            key={user.id}
            label={user.name}
            onChange={() => {
              if (Array.isArray(state)) {
                if (state.includes(user.email)) {
                  setState(state.filter((email) => email !== user.email) as T);
                } else {
                  setState([...state, user.email] as T);
                }
              } else {
                if (state === user.email) {
                  setState("" as T);
                } else {
                  setState(user.email as T);
                }
              }
            }}
            type="checkbox"
          />
        ))}
      </div>
    </div>
  );
}

export default memo(SearchUserCheckbox) as typeof SearchUserCheckbox;
