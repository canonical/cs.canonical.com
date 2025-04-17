import React, { useEffect } from "react";

import TableView from "@/components/Views/TableView";
import { VIEW_OWNED } from "@/config";
import { useStore } from "@/store";
import { useViewsStore } from "@/store/views";

const Owned: React.FC = () => {
  const [setView, setFilter] = useViewsStore((state) => [state.setView, state.setFilter]);
  const user = useStore((state) => state.user);

  useEffect(() => {
    setView(VIEW_OWNED);
    setFilter({
      owners: [user.email],
    });
  }, [setFilter, setView, user.email]);

  return (
    <div className="l-owned-view-page">
      <h2>Owned by me</h2>
      <TableView />
    </div>
  );
};

export default Owned;
