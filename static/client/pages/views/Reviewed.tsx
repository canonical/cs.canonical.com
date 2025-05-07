import React, { useEffect } from "react";

import FilterTableView from "@/components/Views/FilterTableView";
import { VIEW_REVIEWED } from "@/config";
import { useStore } from "@/store";
import { useViewsStore } from "@/store/views";

const Reviewed: React.FC = () => {
  const [setView, setFilter] = useViewsStore((state) => [state.setView, state.setFilter]);
  const user = useStore((state) => state.user);

  useEffect(() => {
    setView(VIEW_REVIEWED);
    setFilter({
      owners: [],
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
  }, [setFilter, setView, user.email]);

  return (
    <div className="l-reviwed-view-page">
      <h2>Reviewed by me</h2>
      <FilterTableView />
    </div>
  );
};

export default Reviewed;
