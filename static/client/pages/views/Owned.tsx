import React from "react";

import TableView from "@/components/Views/TableView";

const Owned: React.FC = () => {
  return (
    <div className="l-owned-view-page">
      <h2>Owned by me</h2>
      <TableView />
    </div>
  );
};

export default Owned;
