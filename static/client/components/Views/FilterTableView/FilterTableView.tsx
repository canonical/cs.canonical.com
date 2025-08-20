import { type ReactNode } from "react";

import FilterandSearch from "./FilterandSearch";

import TableView from "@/components/Views/TableView";

const FilterTableView = (): ReactNode => {
  return (
    <>
      <FilterandSearch />
      <TableView />
    </>
  );
};
export default FilterTableView;
