import React, { useMemo } from "react";

import { Tooltip } from "@canonical/react-components";

import type { IPage } from "@/services/api/types/pages";
import { PageStatus } from "@/services/api/types/pages";

const NavigationElementBadge = ({ page }: { page: IPage }): JSX.Element => {
  const getIcon = useMemo(() => {
    switch (page.status) {
      case PageStatus.NEW:
        return <i className="p-icon--edit is-dark" />;
      case PageStatus.TO_DELETE:
        return <i className="p-icon--archive is-dark" />;
      default:
        return <></>;
    }
  }, [page.status]);

  const getTitle = useMemo(() => {
    switch (page.status) {
      case PageStatus.NEW:
        return "In drafts";
      case PageStatus.TO_DELETE:
        return "To be deleted";
      default:
        return null;
    }
  }, [page.status]);

  const getText = useMemo(() => {
    switch (page.status) {
      case PageStatus.NEW:
        return "This page isn't live yet.";
      case PageStatus.TO_DELETE:
        return "This page is being deleted.";
      default:
        return null;
    }
  }, [page.status]);

  return (
    <Tooltip
      autoAdjust
      message={
        <>
          <b>{getTitle}</b>
          <br />
          {getText}
        </>
      }
      position="right"
      zIndex={1000}
    >
      <div>{getIcon}</div>
    </Tooltip>
  );
};

export default NavigationElementBadge;
