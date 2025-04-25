import { useState, useCallback } from "react";

import { Button, Form, SearchBox } from "@canonical/react-components";

import FiltersBox from "./Filteresbox";

import TableView from "@/components/Views/TableView";
import type { IViewFilter } from "@/services/api/types/views";

const FilterTableView = (): JSX.Element => {
  const [customFilters, setCustomFilters] = useState<IViewFilter>({
    owners: [],
    reviewers: [],
    products: [],
    query: "",
  } as IViewFilter);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const handleSearchChange = useCallback((s: string) => {
    setSearchQuery(s || "");
  }, []);
  //   const handleSearch = (query: string) => {
  //     setSearchQuery(query);
  //     setCustomFilters((prevFilters) => ({
  //       ...prevFilters,
  //       query: query,
  //     }));
  //   };
  //   const handleClear = () => {
  //     setSearchQuery("");
  //     setCustomFilters((prevFilters) => ({
  //       ...prevFilters,
  //       query: "",
  //     }));
  //   };
  console.log(searchQuery);
  const handleFilterClick = () => {
    // Handle filter button click
    document.getElementById("filter-box")?.classList.toggle("u-hide");
  };
  return (
    <>
      <div className="row">
        <div className="col-6">
          <Form
            onSubmit={(event) => {
              console.log("fek");
              event.preventDefault();
              const newCustomfilters: IViewFilter = {
                ...customFilters,
                query: searchQuery,
              };
              setCustomFilters(newCustomfilters);
            }}
          >
            <SearchBox externallyControlled={true} onChange={handleSearchChange} value={searchQuery} />
          </Form>
        </div>
        <div className="col-4">
          <Button appearance="" hasIcon onClick={handleFilterClick}>
            <i className="p-icon--filter" /> <span>Filters</span>
            <i className="p-icon--chevron-down" />
          </Button>
        </div>
        <FiltersBox setCustomFilters={setCustomFilters} />
      </div>
      <TableView customFilters={customFilters} />
    </>
  );
};
export default FilterTableView;
