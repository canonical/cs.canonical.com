import { useCallback, useEffect, useState, type ReactNode } from "react";

import type { IOwnerProps } from "./types";

import CustomSearchAndFilter from "@/components/Common/CustomSearchAndFilter";
import IconTextWithTooltip from "@/components/Common/IconTextWithTooltip";
import config from "@/config";
import { useUsersRequest } from "@/hooks/useUsersRequest";
import { PagesServices } from "@/services/api/services/pages";
import { getDefaultUser } from "@/services/api/services/users";
import { type IUser } from "@/services/api/types/users";

const Owner = ({ page, onSelectOwner }: IOwnerAndReviewersProps): ReactNode => {
  const [currentOwner, setCurrentOwner] = useState<IUser | null>(null);
  const { options, setOptions, handleChange } = useUsersRequest();

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
      setOptions([]);
      setCurrentOwner(option);
      if (onSelectOwner) onSelectOwner(option);
    },
    [page, setOptions, onSelectOwner],
  );

  return (
    <CustomSearchAndFilter
      label={<IconTextWithTooltip icon="information" message={config.tooltips.ownerDef} text="Owner" />}
      onChange={handleChange}
      onRemove={handleRemoveOwner}
      onSelect={selectOwner}
      options={options}
      placeholder="Select an owner"
      selectedOptions={currentOwner ? [currentOwner] : []}
    />
  );
};

export default Owner;
