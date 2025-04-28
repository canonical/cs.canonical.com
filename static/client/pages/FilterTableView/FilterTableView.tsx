import { useState } from "react";

import FilterandSearch from "./FilterandSearch";

import TableView from "@/components/Views/TableView";
import type { IViewFilter } from "@/services/api/types/views";

const FilterTableView = (): JSX.Element => {
  const [customFilters, setCustomFilters] = useState<IViewFilter>({
    owners: [],
    reviewers: [],
    products: [],
    query: "",
  } as IViewFilter);
  return (
    <>
      <FilterandSearch setCustomFilters={setCustomFilters} />
      <TableView customFilters={customFilters} />
    </>
  );
};
export default FilterTableView;
