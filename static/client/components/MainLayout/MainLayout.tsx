import React from "react";

import { Button, NotificationConsumer } from "@canonical/react-components";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Navigation from "@/components/Navigation";
import Search from "@/components/Search";
import { VIEW_TREE } from "@/config";
import { goBack } from "@/helpers/views";
import FilterTableView from "@/pages/FilterTableView";
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
          <div className="row">
            <div className="col-7">
              {location.pathname.includes("/webpage") && view !== VIEW_TREE && (
                <Button hasIcon onClick={goPrev}>
                  <React.Fragment key=".0">
                    <i className="p-icon--chevron-left" /> <span>Back</span>
                  </React.Fragment>
                </Button>
              )}
            </div>
            <div className="col-5">
              <Search />
            </div>
          </div>
          <hr />
          <div className="row">
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
