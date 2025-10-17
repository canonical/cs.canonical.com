import React, { type ReactNode } from "react";

import { Button } from "@canonical/react-components";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Navigation from "@/components/Navigation";
import Search from "@/components/Search";
import FilterTableView from "@/components/Views/FilterTableView";
import { VIEW_TREE } from "@/config";
import { goBack } from "@/helpers/views";
import { useViewsStore } from "@/store/views";

interface IMainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: IMainLayoutProps): ReactNode => {
  const location = useLocation();
  const navigate = useNavigate();
  const view = useViewsStore((state) => state.view);

  function goPrev() {
    return goBack(location, navigate);
  }

  return (
    <>
      <div className="l-application" id="l-application">
        <Navigation />
        <main className="l-main">
          <div className="grid-row--50-50 p-section--shallow">
            <div className="grid-col">
              {location.pathname.includes("/webpage") && view !== VIEW_TREE && (
                <Button className={"u-no-margin--bottom"} hasIcon onClick={goPrev}>
                  <React.Fragment key=".0">
                    <i className="p-icon--chevron-left" /> <span>Back</span>
                  </React.Fragment>
                </Button>
              )}
            </div>
            <div className="grid-col">
              <Search />
            </div>
            <hr className="p-rule" />
          </div>
          <div className="grid-row">
            {location.pathname === "/app" && <FilterTableView />}
            {children}
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
};

export default MainLayout;
