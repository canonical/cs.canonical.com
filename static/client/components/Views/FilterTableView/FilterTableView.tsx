import { type ReactNode } from "react";

import FilterandSearch from "./FilterandSearch";

import DashboardActions from "@/components/DashboardActions";
import TableView from "@/components/Views/TableView";

const FilterTableView = (): ReactNode => {
  return (
    <>
      <FilterandSearch />
      <hr className="p-rule" />
      <DashboardActions />
      <hr className="p-rule" />
      <TableView />
    </>
  );
};
export default FilterTableView;
