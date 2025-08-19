import React from "react";

import { Button, NotificationConsumer } from "@canonical/react-components";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Navigation from "@/components/Navigation";
import Search from "@/components/Search";
import FilterTableView from "@/components/Views/FilterTableView";
import { VIEW_TREE } from "@/config";
import { goBack } from "@/helpers/views";
import { useViewsStore } from "@/store/views";

interface IMainLayoutProps {
  children?: JSX.Element;
}

const MainLayout = ({ children }: IMainLayoutProps): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const view = useViewsStore((state) => state.view);

  function goPrev() {
    return goBack(location, navigate);
  }

  return (
    <>
      <div className="l-application">
        <Navigation />
        <main className="l-main">
          <div className="grid-row--50-50">
            <div className="grid-col">
              {location.pathname.includes("/webpage") && view !== VIEW_TREE && (
                <Button hasIcon onClick={goPrev}>
                  <React.Fragment key=".0">
                    <i className="p-icon--chevron-left" /> <span>Back</span>
                  </React.Fragment>
                </Button>
              )}
            </div>
            <div className="grid-col">
              <Search />
            </div>
          </div>
          <hr />
          <div className="grid-row">
            {location.pathname === "/app" && (
              <>
                <h2>All pages</h2>
                <FilterTableView />
              </>
            )}
            {children}
            <Outlet />
          </div>
        </main>
        <div className="l-notification__container">
          <NotificationConsumer />
        </div>
      </div>
    </>
  );
};

export default MainLayout;
