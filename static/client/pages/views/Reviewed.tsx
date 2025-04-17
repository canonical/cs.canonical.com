import React, { useEffect } from "react";

import TableView from "@/components/Views/TableView";
import { VIEW_REVIEWED } from "@/config";
import { useStore } from "@/store";
import { useViewsStore } from "@/store/views";

const Reviewed: React.FC = () => {
  const [setView, setFilter] = useViewsStore((state) => [state.setView, state.setFilter]);
  const user = useStore((state) => state.user);

  useEffect(() => {
    setView(VIEW_REVIEWED);
    setFilter({
      reviewers: [user.email],
    });
  }, [setFilter, setView, user.email]);

  return (
    <div className="l-reviwed-view-page">
      <h2>Reviewed by me</h2>
      <TableView />
    </div>
  );
};

export default Reviewed;
