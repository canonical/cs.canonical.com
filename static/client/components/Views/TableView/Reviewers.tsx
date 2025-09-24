import React, { useState } from "react";

import { Button } from "@canonical/react-components";

import type { IUser } from "@/services/api/types/users";

interface ReviewersProps {
  reviewers: IUser[];
}

const Reviewers: React.FC<ReviewersProps> = ({ reviewers }) => {
  const [showMore, setShowMore] = useState(false);

  const toggleShowMore = () => {
    setShowMore((prev) => !prev);
  };

  const getReviewers = () => {
    let reviewerNames = reviewers?.map((reviewer) => reviewer.name) || [];
    if (reviewerNames.length <= 2) {
      return reviewerNames.join(", ");
    }
    return (
      <>
        {showMore ? reviewerNames.join(", ") : reviewerNames.slice(0, 2).join(", ")}
        <br />
        <Button appearance="link" onClick={toggleShowMore}>
          {showMore ? "Show less" : `Show ${reviewerNames.length - 2} more`}
        </Button>
      </>
    );
  };

  return <>{getReviewers()}</>;
};

export default Reviewers;
