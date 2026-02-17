import React, { useEffect } from "react";

import DashboardActions from "@/components/DashboardActions";
import Navigation from "@/components/Navigation";
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
        <DashboardActions />
      </main>
    </div>
  );
};

export default Home;
