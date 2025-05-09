import React, { useState, useCallback, useEffect, useMemo } from "react";

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

  const [activeFilter, setActiveFilter] = useState<string>("filter-group-owner");

  const handleSearchChange = useCallback((s: string) => {
    setSearchQuery(s || "");
  }, []);

  const handleClear = useCallback(() => {
    setSelectedOwner([]);
    setSelectedReviewer([]);
    setSelectedProduct([]);
    setFilter({
      owners: [],
      reviewers: [],
      products: [],
    });
  }, [setFilter]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setFilter({
      ...filter,
      query: "",
    });
  }, [filter, setFilter]);

  const applySearch = useCallback(() => {
    setFilter({
      ...filter,
      query: searchQuery,
    });
  }, [filter, searchQuery, setFilter]);

  const totalFilters = useMemo(
    () => selectedOwner?.length + selectedReviewer?.length + selectedProduct?.length,
    [selectedOwner, selectedProduct, selectedReviewer],
  );

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
  };

  const FilterGroupReviewer = "filter-group-reviewer";
  const FilterGroupOwner = "filter-group-owner";
  const FilterGroupProduct = "filter-group-product";

  return (
    <>
      <div className="row">
        <div className="col-6">
          <SearchBox
            externallyControlled={true}
            onChange={handleSearchChange}
            onClear={clearSearch}
            onSearch={applySearch}
            value={searchQuery}
          />
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
            visible={false}
          >
            <div className="p-filter__body">
              <div className="row p-divider u-no-margin--bottom u-no-padding">
                <div className="col-5 p-divider__block">
                  <Button
                    appearance="base"
                    aria-controls={FilterGroupOwner}
                    className={`u-no-margin u-align--left p-filter__button ${
                      activeFilter === FilterGroupOwner && "p-filter__button--active"
                    }`}
                    hasIcon
                    onClick={handleFilterClick}
                  >
                    <i className="p-icon--user" style={{ paddingRight: "3rem" }} /> <span>By owner</span>&nbsp;
                    {!!selectedOwner.length && (
                      <Badge className="u-no-padding--top  u-no-margin--bottom" value={selectedOwner.length} />
                    )}
                  </Button>
                  <Button
                    appearance="base"
                    aria-controls={FilterGroupReviewer}
                    className={`u-no-margin u-align--left p-filter__button ${
                      activeFilter === FilterGroupReviewer && "p-filter__button--active"
                    }`}
                    hasIcon
                    onClick={handleFilterClick}
                  >
                    <i className="p-icon--show" style={{ paddingRight: "3rem" }} /> <span>By reviewer</span>&nbsp;
                    {!!selectedReviewer.length && (
                      <Badge
                        className="u-no-padding--top  u-no-margin--bottom"
                        value={selectedReviewer ? selectedReviewer.length : 0}
                      />
                    )}
                  </Button>

                  <Button
                    appearance="base"
                    aria-controls={FilterGroupProduct}
                    className={`u-no-margin u-align--left p-filter__button ${
                      activeFilter === FilterGroupProduct && "p-filter__button--active"
                    }`}
                    hasIcon
                    onClick={handleFilterClick}
                  >
                    <i className="p-icon--repository" style={{ paddingRight: "3rem" }} /> <span>By product</span>
                    &nbsp;
                    {!!selectedProduct.length && (
                      <Badge
                        className="u-no-padding--top  u-no-margin--bottom"
                        value={selectedProduct ? selectedProduct.length : 0}
                      />
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
              <div className="u-align--right p-filter-panel__footer">
                <Button appearance="link" className={"u-no-margin"} onClick={handleClear}>
                  Clear all
                </Button>
                <Button appearance="positive" className={"u-no-margin"} onClick={handleApply}>
                  Apply
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
