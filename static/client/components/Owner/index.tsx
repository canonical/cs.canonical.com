import { useCallback, useEffect, useState, type ReactNode } from "react";

import type { IOwnerProps } from "./types";

import CustomSearchAndFilter from "@/components/Common/CustomSearchAndFilter";
import IconTextWithTooltip from "@/components/Common/IconTextWithTooltip";
import config from "@/config";
import { useUsers } from "@/services/api/hooks/users";
import { PagesServices } from "@/services/api/services/pages";
import { getDefaultUser } from "@/services/api/services/users";
import { type IUser } from "@/services/api/types/users";

const Owner = ({ page, onSelectOwner }: IOwnerProps): ReactNode => {
  const [currentOwner, setCurrentOwner] = useState<IUser | null>(null);
  const { data, isLoading } = useUsers();

  useEffect(() => {
    let owner = null;
    if (Boolean(window.__E2E_TESTING__)) {
      owner = getDefaultUser();
    }

    if (page) {
      owner = page.owner as IUser | null;
      if (page.owner.name === "Default" || !page.owner.email) owner = null;
    }

    setCurrentOwner(owner);
    if (onSelectOwner) onSelectOwner(owner);
  }, [onSelectOwner, page]);

  const handleRemoveOwner = useCallback(
    () => () => {
      setCurrentOwner(null);
      if (page?.id) PagesServices.setOwner({}, page.id);
      if (onSelectOwner) onSelectOwner(null);
    },
    [page, onSelectOwner],
  );

  const selectOwner = useCallback(
    (option: IUser) => {
      if (page?.id) {
        PagesServices.setOwner(option, page.id).then(() => {
          page.owner = option;
        });
      }
      setCurrentOwner(option);
      if (onSelectOwner) onSelectOwner(option);
    },
    [page, onSelectOwner],
  );

  return (
    <CustomSearchAndFilter<IUser>
      label={<IconTextWithTooltip icon="information" message={config.tooltips.ownerDef} text="Owner" />}
      loading={!!isLoading}
      onRemove={handleRemoveOwner}
      onSelect={selectOwner}
      options={data || []}
      placeholder="Select an owner"
      selectedOptions={currentOwner ? [currentOwner] : []}
    />
  );
};

export default Owner;
