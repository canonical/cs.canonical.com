import React, { useEffect, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { type IBreadcrumb } from "./Breadcrumbs.types";

const Breadcrumbs = () => {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<IBreadcrumb[]>([]);
  const navigate = useNavigate();

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

  return (
    <div className="l-breadcrumbs">
      {breadcrumbs.map((bc, index) => (
        <React.Fragment key={`bc-${index}`}>
          {index < breadcrumbs.length - 1 ? (
            <a className="p-text--small-caps" href={bc.link} onClick={(e) => goToPage(e, bc.link)}>
              {bc.name}
            </a>
          ) : (
            <span className="p-text--small-caps">{bc.name}</span>
          )}
          {index < breadcrumbs.length - 1 && <span>&nbsp;/&nbsp;</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;
