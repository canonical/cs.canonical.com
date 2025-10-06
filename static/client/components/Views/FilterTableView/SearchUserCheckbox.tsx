import React, { useState, memo, useCallback, useMemo, type ReactNode, useEffect } from "react";

import { SearchBox, Input, Spinner } from "@canonical/react-components";

import config from "@/config";
import { useUsers } from "@/services/api/hooks/users";
import type { IUser } from "@/services/api/types/users";

type SearchUserCheckboxProps<T extends string[]> = {
  state: T;
  setState: React.Dispatch<React.SetStateAction<T>>;
};

function SearchUserCheckbox<T extends string[]>({ state, setState }: SearchUserCheckboxProps<T>): ReactNode {
  const { data: allFetchedUsers = [], isLoading } = useUsers();

  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(config.infiniteScroll.initialLoadCount);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();

    // If no data or search term is short, return all data
    if (!allFetchedUsers.length || term.length < 2) {
      return allFetchedUsers;
    }

    // Otherwise, filter based on the search term
    return allFetchedUsers.filter((user) => user.name.toLowerCase().includes(term));
  }, [allFetchedUsers, searchTerm]);

  useEffect(() => {
    setVisibleCount(config.infiniteScroll.initialLoadCount);
  }, [filteredUsers.length]);

  const searchUsers = useCallback((s: string): void => {
    setSearchTerm(s);
  }, []);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const container = e.currentTarget;

      const scrollPosition = container.scrollTop + container.clientHeight;
      const contentHeight = container.scrollHeight;

      const hasMoreToRender = visibleCount < filteredUsers.length;

      if (scrollPosition >= contentHeight - config.infiniteScroll.scrollThreshold && hasMoreToRender) {
        setVisibleCount((prevCount) => Math.min(prevCount + config.infiniteScroll.loadMoreCount, filteredUsers.length));
      }
    },
    [visibleCount, filteredUsers.length],
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

  const visibleAndSortedUsers = useMemo(() => {
    const sorted = [...filteredUsers].sort((a, b) => {
      const aChecked = state.includes(a.email);
      const bChecked = state.includes(b.email);

      if (aChecked !== bChecked) {
        return aChecked ? -1 : 1; // Checked users come first
      }

      // If both are either checked or unchecked, sort by name
      return a.name.localeCompare(b.name);
    });

    return sorted.slice(0, visibleCount);
  }, [filteredUsers, state, visibleCount]);

  const hasMoreToRender = visibleCount < filteredUsers.length;

  return (
    <div className="u-sv3">
      <SearchBox className="filter-search" onChange={searchUsers} />

      {isLoading && <Spinner text="Loading all users..." />}

      {!isLoading && filteredUsers.length === 0 && <div>No users found.</div>}

      <div className="u-sv3 p-filter__group" onScroll={handleScroll}>
        {visibleAndSortedUsers.map((user) => (
          <Input
            checked={state.includes(user.email)}
            key={user.id}
            label={user.name}
            onChange={() => handleCheckboxChange(user)}
            type="checkbox"
          />
        ))}

        {!isLoading && hasMoreToRender && <Spinner text="Loading more users..." />}

        {!isLoading && !hasMoreToRender && filteredUsers.length > 0 && (
          <small className="u-text--muted">End of list ({filteredUsers.length} total users).</small>
        )}
      </div>
    </div>
  );
}

export default memo(SearchUserCheckbox) as typeof SearchUserCheckbox;
