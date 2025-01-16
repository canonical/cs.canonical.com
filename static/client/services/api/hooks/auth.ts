import { useCallback } from "react";

import { useQuery } from "react-query";

import { getCurrentUser } from "@/services/api/services/users";
import { useStore } from "@/store";

export function useAuth() {
  const [user, setUser] = useStore((state) => [state.user, state.setUser]);

  const result = useQuery({
    queryKey: "loggedInUser",
    queryFn: () => {
      getCurrentUser().then((res) => {
        setUser(res);
      });
    },
  });

  const refetch = useCallback(() => {
    return result.refetch();
  }, [result]);

  const isLoading = result.isLoading;
  const isFetching = result.isFetching;
  const error = result.error;

  return { isLoading, user, error, refetch, isFetching };
}
