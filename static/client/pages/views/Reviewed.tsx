import React from "react";

import TableView from "@/components/Views/TableView";

const Reviewed: React.FC = () => {
  return (
    <div className="l-reviwed-view-page">
      <h2>Reviewed by me</h2>
      <TableView />
    </div>
  );
};

export default Reviewed;
