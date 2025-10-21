import React, { useEffect } from "react";

import DashboardActions from "@/components/DashboardActions";
import Navigation from "@/components/Navigation";
import Search from "@/components/Search";
import TableView from "@/components/Views/TableView";
import { useStore } from "@/store";
import { useViewsStore } from "@/store/views";

const Home: React.FC = () => {
  const setFilter = useViewsStore((state) => state.setFilter);
  const user = useStore((state) => state.user);

  useEffect(() => {
    setFilter({
      owners: [user.email],
      reviewers: [user.email],
      products: [],
      query: "",
    });
    return () => {
      setFilter({
        owners: [],
        reviewers: [],
        products: [],
        query: "",
      });
    };
  }, [setFilter, user.email]);

  return (
    <div className="l-application" id="l-application">
      <Navigation />
      <main className="l-main">
        <div className="p-section--shallow">
          <div className="grid-row--25-75">
            <hr className="p-rule" />
            <div className="grid-col">
              <p className="p-text--small-caps">Search pages</p>
            </div>
            <div className="grid-col">
              <Search />
            </div>
          </div>
        </div>
        <DashboardActions />
        <div className="grid-row">
          <hr className="p-rule" />
          <p className="p-text--small-caps">My pages</p>
          <TableView />
        </div>
      </main>
    </div>
  );
};

export default Home;
