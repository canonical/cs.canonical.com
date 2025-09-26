import { useCallback, useEffect, useState, type ReactNode } from "react";

import type { IReviewersProps } from "./types";

import CustomSearchAndFilter from "@/components/Common/CustomSearchAndFilter";
import IconTextWithTooltip from "@/components/Common/IconTextWithTooltip";
import config from "@/config";
import { useUsersRequest } from "@/hooks/useUsersRequest";
import { PagesServices } from "@/services/api/services/pages";
import { type IUser } from "@/services/api/types/users";

const Reviewers = ({ page, onSelectReviewers }: IReviewersProps): ReactNode => {
  const [currentReviewers, setCurrentReviewers] = useState<IUser[]>([]);
  const { options, setOptions, handleChange } = useUsersRequest();

  useEffect(() => {
    if (page) setCurrentReviewers(page.reviewers);
  }, [page]);

  const handleRemoveReviewer = useCallback(
    (option?: IUser) => () => {
      const newReviewers = currentReviewers.filter((r) => r.id !== option?.id);
      setCurrentReviewers(newReviewers);
      if (page?.id)
        PagesServices.setReviewers(newReviewers, page.id).then(() => {
          page.reviewers = newReviewers;
        });
      if (onSelectReviewers) onSelectReviewers(newReviewers);
    },
    [currentReviewers, page, onSelectReviewers],
  );

  const selectReviewer = useCallback(
    (option: IUser) => {
      // check if a person with the same email already exists
      // proceed with setting the reviewer only if not
      if (!currentReviewers.find((r) => r.email === option.email)) {
        const newReviewers = [...currentReviewers, option];
        if (page?.id) {
          PagesServices.setReviewers(newReviewers, page.id).then(() => {
            page.reviewers = newReviewers;
          });
        }
        setOptions([]);
        setCurrentReviewers(newReviewers);
        if (onSelectReviewers) onSelectReviewers(newReviewers);
      }
    },
    [page, currentReviewers, setOptions, onSelectReviewers],
  );

  return (
    <CustomSearchAndFilter<IUser>
      label={<IconTextWithTooltip icon="information" message={config.tooltips.reviewerDef} text="Reviewers" />}
      onChange={handleChange}
      onRemove={handleRemoveReviewer}
      onSelect={selectReviewer}
      options={options}
      placeholder="Select reviewers"
      selectedOptions={currentReviewers}
    />
  );
};

export default Reviewers;
