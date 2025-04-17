import React, { useState } from "react";

import { Button } from "@canonical/react-components";

import type { IPage } from "@/services/api/types/pages";

interface ReviewersProps {
  page: IPage;
}

const Reviewers: React.FC<ReviewersProps> = ({ page }) => {
  const [showMore, setShowMore] = useState(false);

  const toggleShowMore = () => {
    setShowMore((prev) => !prev);
  };

  const getReviewers = () => {
    let reviewers = page.reviewers.map((reviewer) => reviewer.name);
    if (reviewers.length <= 2) {
      return reviewers.join(", ");
    }
    return (
      <>
        {showMore ? reviewers.join(", ") : reviewers.slice(0, 2).join(", ")}
        <br />
        <Button appearance="link" onClick={toggleShowMore}>
          {showMore ? "Show less" : `Show ${reviewers.length - 2} more`}
        </Button>
      </>
    );
  };

  return <>{getReviewers()}</>;
};

export default Reviewers;
