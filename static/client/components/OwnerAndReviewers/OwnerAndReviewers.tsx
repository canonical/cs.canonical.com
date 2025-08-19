import { type ReactNode } from "react";

import Owner from "./Owner";
import type { IOwnerAndReviewersProps } from "./OwnerAndReviewers.types";
import Reviewers from "./Reviewers";

const OwnerAndReviewers = ({ page, onSelectOwner, onSelectReviewers }: IOwnerAndReviewersProps): ReactNode => (
  <>
    <Owner onSelectOwner={onSelectOwner} page={page} />
    <div className="u-sv3" />
    <Reviewers onSelectReviewers={onSelectReviewers} page={page} />
  </>
);

export default OwnerAndReviewers;
