import React, { useEffect, useState } from "react";

import { Button, Tooltip } from "@canonical/react-components";
import { useLocation, useNavigate } from "react-router-dom";

import { type IBreadcrumb } from "./Breadcrumbs.types";

import { findPage } from "@/services/tree/pages";
import { useStore } from "@/store";

const Breadcrumbs = () => {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<IBreadcrumb[]>([]);
  const navigate = useNavigate();
  const selectedProject = useStore((state) => state.selectedProject);

  useEffect(() => {
    const pageIndex = location.pathname.indexOf("app/webpage/");
    if (pageIndex > 0) {
      const parts = location.pathname.split("app/webpage/")[1].split("/");
      if (parts.length) {
        let accumulatedPath = "";
        const paths = parts?.map((part) => {
          accumulatedPath = `${accumulatedPath}/${part}`;
          return {
            name: part,
            link: `/app/webpage${accumulatedPath}`,
          };
        });
        setBreadcrumbs(paths);
      }
    } else {
      setBreadcrumbs([]);
    }
  }, [location]);

  const goToPage = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
      e.preventDefault();
      navigate(path);
    },
    [navigate],
  );

  function isValidPage(path: string) {
    if (!selectedProject) return false;
    const pageUrl = path.split(`/${selectedProject.name}`)[1];
    if (!pageUrl) return true; // Means it's parent index
    const page = findPage(selectedProject.templates, pageUrl, "", true);
    return page && typeof page === "object" && "ext" in page && page.ext !== ".dir";
  }

  return (
    <div className="l-breadcrumbs">
      {breadcrumbs.map((bc, index) => (
        <React.Fragment key={`bc-${index}`}>
          {index < breadcrumbs.length - 1 ? (
            isValidPage(bc.link) ? (
              <a className="p-text--small-caps" href={bc.link} onClick={(e) => goToPage(e, bc.link)}>
                {bc.name}
              </a>
            ) : (
              <Tooltip
                message="This part of the path isn't a page and can't be opened"
                position="btm-center"
                zIndex={999}
              >
                <Button className="p-button--base u-no-margin u-no-padding" disabled>
                  {bc.name}
                </Button>
              </Tooltip>
            )
          ) : (
            <span className="p-text--small-caps">{bc.name}</span>
          )}
          {index < breadcrumbs.length - 1 && <span aria-hidden="true">&nbsp;/&nbsp;</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;
