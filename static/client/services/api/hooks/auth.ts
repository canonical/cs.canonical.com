import { useQuery } from "react-query";

import { getCurrentUser } from "@/services/api/services/users";
import type { IApiBasicError, IUseQueryHookRest } from "@/services/api/types/query";
import type { IUser } from "@/services/api/types/users";
import { useStore } from "@/store";

export function useAuth(): IUseQueryHookRest<IUser> {
  const [user, setUser] = useStore((state) => [state.user ?? undefined, state.setUser]);

  const result = useQuery<IUser, IApiBasicError>("loggedInUser", async () => {
    try {
      const res = await getCurrentUser();
      setUser(res);
      return res;
    } catch (error) {
      throw new Error("Failed to fetch current user");
    }
  });

  const isLoading = result.isLoading;
  const isFetching = result.isFetching;
  const error = result.error;

  return { isLoading, data: user, error, isFetching };
}
