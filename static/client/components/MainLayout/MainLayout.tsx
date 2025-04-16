import { NotificationConsumer } from "@canonical/react-components";
import { Outlet, useLocation } from "react-router-dom";

import Breadcrumbs from "@/components/Breadcrumbs";
import Navigation from "@/components/Navigation";
import Search from "@/components/Search";
import TableView from "@/components/Views/TableView";

interface IMainLayoutProps {
  children?: JSX.Element;
}

const MainLayout = ({ children }: IMainLayoutProps): JSX.Element => {
  const location = useLocation();

  return (
    <>
      <div className="l-application">
        <Navigation />
        <main className="l-main">
          <div className="row">
            <div className="col-7">
              <Breadcrumbs />
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
                <TableView />
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
