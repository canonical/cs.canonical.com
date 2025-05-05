import React, { useState, useCallback, useRef, useEffect } from "react";

import { Button, Badge, ContextualMenu, SearchBox } from "@canonical/react-components";

import "./_FilterTableView.scss";
import SearchProductCheckbox from "./SearchProductCheckbox";
import SearchUserCheckbox from "./SearchUserCheckbox";

import type { IViewFilter } from "@/services/api/types/views";
import { useViewsStore } from "@/store/views";

const FilterandSearch = (): JSX.Element => {
  const [filter, setFilter] = useViewsStore((state) => {
    return [state.filter, state.setFilter];
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string[]>([]);

  useEffect(() => {
    setSelectedOwner(filter.owners);
    setSelectedReviewer(filter.reviewers);
    setSelectedProduct(filter.products);
    setSearchQuery(filter.query || "");
  }, [filter]);

  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>("filter-group-owner");

  const filterandSearchDOM = useRef<HTMLDivElement>(null);

  const handleSearchChange = useCallback((s: string) => {
    setSearchQuery(s || "");
  }, []);
  const hideFilter = () => {
    setShowFilter(false);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const ariaControls = event.currentTarget.getAttribute("aria-controls");
    setActiveFilter(ariaControls || "filter-group-owner");
  };

  const handleApply = () => {
    setFilter({
      owners: selectedOwner,
      reviewers: selectedReviewer,
      products: selectedProduct,
      query: searchQuery,
    } as IViewFilter);
    hideFilter();
  };

  const handleClear = () => {
    setSelectedOwner([]);
    setSelectedReviewer([]);
    setSelectedProduct([]);
    setFilter({
      owners: [],
      reviewers: [],
      products: [],
    });
  };

  const FilterGroupReviewer = "filter-group-reviewer";
  const FilterGroupOwner = "filter-group-owner";
  const FilterGroupProduct = "filter-group-product";

  const totalFilters =
    (selectedOwner ? selectedOwner.length : 0) +
    (selectedReviewer ? selectedReviewer.length : 0) +
    (selectedProduct ? selectedProduct.length : 0);
  return (
    <>
      <div className="row" ref={filterandSearchDOM}>
        <div className="col-6">
          <form>
            <SearchBox
              externallyControlled={true}
              onChange={handleSearchChange}
              onClear={() => {
                setSearchQuery("");
                setFilter({
                  ...filter,
                  query: "",
                });
              }}
              onSearch={() => {
                setFilter({
                  ...filter,
                  query: searchQuery,
                });
              }}
              value={searchQuery}
            />
          </form>
        </div>
        <div className="col-6">
          <ContextualMenu
            closeOnEsc={true}
            closeOnOutsideClick={true}
            hasToggleIcon
            toggleLabel={
              <>
                {" "}
                <i className="p-icon--filter" /> <span>Filters</span>&nbsp;
                {totalFilters !== 0 ? (
                  <Badge className="u-no-padding--top  u-no-margin--bottom" value={totalFilters} />
                ) : (
                  ""
                )}
                <span style={{ paddingRight: "10rem" }}></span>
              </>
            }
            visible={showFilter}
          >
            <div className="filter-body">
              <div className="row p-divider u-no-margin--bottom" style={{ padding: "0" }}>
                <div className="col-5 p-divider__block">
                  <Button
                    appearance="base"
                    aria-controls={FilterGroupOwner}
                    className={
                      activeFilter === FilterGroupOwner
                        ? "p-filter__button--active u-align--left u-no-margin--right"
                        : "u-no-margin--right u-align--left"
                    }
                    hasIcon
                    onClick={handleFilterClick}
                    small
                    style={{ width: "12.38rem", padding: "0.3rem", marginBottom: "0.1rem" }}
                  >
                    <i className="p-icon--user" style={{ paddingRight: "3rem" }} /> <span>By owner</span>&nbsp;
                    {selectedOwner.length !== 0 ? (
                      <Badge
                        className="u-no-padding--top  u-no-margin--bottom"
                        value={selectedOwner ? selectedOwner.length : 0}
                      />
                    ) : (
                      ""
                    )}
                  </Button>
                  <Button
                    appearance="base"
                    aria-controls={FilterGroupReviewer}
                    className={
                      activeFilter === FilterGroupReviewer
                        ? "p-filter__button--active u-no-margin--right u-align--left"
                        : "u-no-margin--right u-align--left"
                    }
                    hasIcon
                    onClick={handleFilterClick}
                    small
                    style={{ width: "12.38rem", padding: "0.3rem", marginBottom: "0.1rem" }}
                  >
                    <i className="p-icon--show" style={{ paddingRight: "3rem" }} /> <span>By reviewer</span>&nbsp;
                    {selectedReviewer.length !== 0 ? (
                      <Badge
                        className="u-no-padding--top  u-no-margin--bottom"
                        value={selectedReviewer ? selectedReviewer.length : 0}
                      />
                    ) : (
                      ""
                    )}
                  </Button>
                  <Button
                    appearance="base"
                    aria-controls={FilterGroupProduct}
                    className={
                      activeFilter === FilterGroupProduct
                        ? "p-filter__button--active u-no-margin--right u-align--left"
                        : "u-no-margin--right u-align--left"
                    }
                    hasIcon
                    onClick={handleFilterClick}
                    small
                    style={{ width: "12.38rem", padding: "0.3rem", marginBottom: "0.1rem" }}
                  >
                    <i className="p-icon--repository" style={{ paddingRight: "3rem" }} /> <span>By product</span>
                    &nbsp;
                    {selectedProduct.length !== 0 ? (
                      <Badge
                        className="u-no-padding--top  u-no-margin--bottom"
                        value={selectedProduct ? selectedProduct.length : 0}
                      />
                    ) : (
                      ""
                    )}
                  </Button>
                </div>
                <div className="col-7 p-divider__block">
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
              <div className="u-align--right" style={{ padding: "0 0.5rem 0 0.5rem" }}>
                <Button appearance="link" hasIcon onClick={handleClear} small>
                  {" "}
                  <span>Clear all</span>
                </Button>
                <Button appearance="positive" hasIcon onClick={handleApply} small style={{ marginLeft: "0.5rem" }}>
                  <span>Apply</span>
                </Button>
              </div>
            </div>
          </ContextualMenu>
        </div>
      </div>
    </>
  );
};

export default FilterandSearch;
