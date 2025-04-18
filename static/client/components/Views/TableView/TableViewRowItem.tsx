import React from "react";

import TableViewRow from "./TableViewRow";

import type { IPage } from "@/services/api/types/pages";

interface TableViewRowItemProps {
  page: IPage;
}

const TableViewRowItem: React.FC<TableViewRowItemProps> = ({ page }) => {
  return (
    <>
      <TableViewRow page={page} />
      {page.children.map((child) => {
        return <TableViewRowItem key={`${child.project?.name}${child.url}`} page={child} />;
      })}
    </>
  );
};

export default TableViewRowItem;
