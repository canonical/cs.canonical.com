import React, { useState, useCallback } from "react";

import { Button, Badge, Card, SearchBox } from "@canonical/react-components";

import "./_FilterTableView.scss";
import SearchProductCheckbox from "./SearchProductCheckbox";
import SearchUserCheckbox from "./SearchUserCheckbox";

import type { IViewFilter } from "@/services/api/types/views";

const FilterandSearch = ({
  setCustomFilters,
}: {
  setCustomFilters: React.Dispatch<React.SetStateAction<IViewFilter>>;
}): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [selectedReviewer, setSelectedReviewer] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string[]>([]);

  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>("filter-group-owner");

  const handleSearchChange = useCallback((s: string) => {
    setSearchQuery(s || "");
  }, []);

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const ariaControls = event.currentTarget.getAttribute("aria-controls");
    setActiveFilter(ariaControls || "filter-group-owner");
  };

  const handleApply = () => {
    setCustomFilters(() => {
      return {
        owners: selectedOwner ? [selectedOwner] : [],
        reviewers: selectedReviewer,
        products: selectedProduct,
        query: searchQuery,
      } as IViewFilter;
    });
    handleFilterToggle();
  };

  const handleClear = () => {
    setSelectedOwner("");
    setSelectedReviewer([]);
    setSelectedProduct([]);
    setCustomFilters((prevFilters: IViewFilter) => ({
      owners: [],
      reviewers: [],
      products: [],
      query: "",
    }));
  };

  const handleFilterToggle = () => {
    setShowFilter(!showFilter);
  };

  const FilterGroupReviewer = "filter-group-reviewer";
  const FilterGroupOwner = "filter-group-owner";
  const FilterGroupProduct = "filter-group-product";

  const totalFilters =
    (selectedOwner ? 1 : 0) +
    (selectedReviewer ? selectedReviewer.length : 0) +
    (selectedProduct ? selectedProduct.length : 0);
  return (
    <>
      <div className="row">
        <div className="col-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleApply();
            }}
          >
            <SearchBox
              externallyControlled={true}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // stop SearchBox from doing anything weird
                  handleApply();
                }
              }}
              value={searchQuery}
            />
          </form>
        </div>
        <div className="col-4">
          <Button appearance="" hasIcon onClick={handleFilterToggle}>
            <i className="p-icon--filter" /> <span>Filters</span>&nbsp;
            <Badge className="u-no-padding--top u-no-margin--bottom" value={totalFilters} />
            <i className="p-icon--chevron-down" />
          </Button>
        </div>
        <div className="col-6 col-start-large-5">
          <Card className={showFilter ? "filter-box" : "u-hide"} title="">
            <div className="row p-divider u-no-margin--bottom">
              <div className="col-2 p-divider__block filter-box__buttons">
                <Button
                  appearance="base"
                  aria-controls={FilterGroupOwner}
                  className={
                    activeFilter === FilterGroupOwner
                      ? "p-filter__button--active u-no-margin--right"
                      : "u-no-margin--right"
                  }
                  hasIcon
                  onClick={handleFilterClick}
                  small
                  style={{ width: "10rem", padding: "0.25rem" }}
                >
                  <i className="p-icon--user" /> <span>By owner</span>&nbsp;
                  <Badge className="u-no-padding--top  u-no-margin--bottom" value={selectedOwner ? 1 : 0} />
                </Button>
                <Button
                  appearance="base"
                  aria-controls={FilterGroupReviewer}
                  className={
                    activeFilter === FilterGroupReviewer
                      ? "p-filter__button--active u-no-margin--right"
                      : "u-no-margin--right"
                  }
                  hasIcon
                  onClick={handleFilterClick}
                  small
                  style={{ width: "10rem", padding: "0.25rem" }}
                >
                  <i className="p-icon--show" /> <span>By reviewer</span>&nbsp;
                  <Badge
                    className="u-no-padding--top  u-no-margin--bottom"
                    value={selectedReviewer ? selectedReviewer.length : 0}
                  />
                </Button>
                <Button
                  appearance="base"
                  aria-controls={FilterGroupProduct}
                  className={
                    activeFilter === FilterGroupProduct
                      ? "p-filter__button--active u-no-margin--right"
                      : "u-no-margin--right"
                  }
                  hasIcon
                  onClick={handleFilterClick}
                  small
                  style={{ width: "10rem", padding: "0.25rem" }}
                >
                  <i className="p-icon--repository" /> <span>By product</span>
                  &nbsp;
                  <Badge
                    className="u-no-padding--top u-no-margin--bottom"
                    value={selectedProduct ? selectedProduct.length : 0}
                  />
                </Button>
              </div>
              <div className="col-4 p-divider__block filter-box__content">
                <form>
                  <div className={activeFilter === FilterGroupOwner ? "" : "u-hide"} id={FilterGroupOwner}>
                    <SearchUserCheckbox setState={setSelectedOwner} state={selectedOwner} />{" "}
                  </div>
                  <div className={activeFilter === FilterGroupReviewer ? "" : "u-hide"} id={FilterGroupReviewer}>
                    <SearchUserCheckbox setState={setSelectedReviewer} state={selectedReviewer} />
                  </div>
                  <div className={activeFilter === FilterGroupProduct ? "" : "u-hide"} id={FilterGroupProduct}>
                    <SearchProductCheckbox setState={setSelectedProduct} state={selectedProduct} />
                  </div>
                </form>
              </div>
            </div>
            <hr />
            <div className="u-align--right" style={{ padding: "0.5rem" }}>
              <Button appearance="link" hasIcon onClick={handleClear} small>
                {" "}
                <span>Clear all</span>
              </Button>
              <Button appearance="positive" hasIcon onClick={handleApply} small>
                <span>Apply</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default FilterandSearch;
