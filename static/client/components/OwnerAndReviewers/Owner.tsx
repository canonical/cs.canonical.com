import { useCallback, useEffect, useState } from "react";

import { useUsersRequest } from "./OwnerAndReviewers.hooks";
import type { IOwnerAndReviewersProps } from "./OwnerAndReviewers.types";

import CustomSearchAndFilter from "@/components/Common/CustomSearchAndFilter";
import IconTextWithTooltip from "@/components/Common/IconTextWithTooltip";
import config from "@/config";
import { PagesServices } from "@/services/api/services/pages";
import { type IUser } from "@/services/api/types/users";

const Owner = ({ page, onSelectOwner }: IOwnerAndReviewersProps): JSX.Element => {
  const [currentOwner, setCurrentOwner] = useState<IUser | null>(null);
  const { options, setOptions, handleChange } = useUsersRequest();

  useEffect(() => {
    if (page) {
      let owner = page.owner as IUser | null;
      if (page.owner.name === "Default" || !page.owner.email) owner = null;
      setCurrentOwner(owner);
      if (onSelectOwner) onSelectOwner(owner);
    }
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
