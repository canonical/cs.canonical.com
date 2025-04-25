import React, { useMemo, useState } from "react";

import { Button, Card } from "@canonical/react-components";

import "./_FilterTableView.scss";
import SearchUserCheckbox from "./SearchUserCheckbox";

import type { IViewFilter } from "@/services/api/types/views";

const FiltersBox = ({
  setCustomFilters,
}: {
  setCustomFilters: React.Dispatch<React.SetStateAction<IViewFilter>>;
}): JSX.Element => {
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [selectedReviewer, setSelectedReviewer] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string[]>([]);

  const [activeFilter, setActiveFilter] = useState<string>("filter-group-owner");
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const ariaControls = event.currentTarget.getAttribute("aria-controls");
    setActiveFilter(ariaControls || "filter-group-owner");
  };
  const activeFiltergroup = useMemo(() => {
    if (activeFilter === "filter-group-owner") {
      return (
        <div id="filter-group-owner">
          <SearchUserCheckbox setState={setSelectedOwner} state={selectedOwner} />{" "}
        </div>
      );
    } else if (activeFilter === "filter-group-reviewers") {
      return (
        <div id="filter-group-reviewer">
          <SearchUserCheckbox setState={setSelectedReviewer} state={selectedReviewer} />
        </div>
      );
    } else if (activeFilter === "filter-group-product") {
      return <div id="filter-group-product">Products </div>;
    }
  }, [activeFilter, selectedOwner, selectedReviewer]);

  const handleApply = () => {
    setCustomFilters((prevFilters: IViewFilter) => {
      return {
        ...prevFilters,
        owners: [selectedOwner],
        reviewers: selectedReviewer,
        products: selectedProduct,
      } as IViewFilter;
    });
  };
  const handleClear = () => {
    setSelectedOwner("");
    setSelectedReviewer([]);
    setSelectedProduct([]);
    setCustomFilters((prevFilters: IViewFilter) => ({
      ...prevFilters,
      owners: [],
      reviewers: [],
      products: [],
    }));
  };

  return (
    <div className="row">
      <div className="col-6 col-start-large-4">
        <Card className="u-hide " id="filter-box" title="">
          <div className="row p-divider">
            <div className="col-2 p-divider__block">
              <Button
                appearance="base"
                aria-controls="filter-group-owner"
                className="active-filter-box"
                hasIcon
                onClick={handleFilterClick}
                small
              >
                <i className="p-icon--user" /> <span>By owner</span>
              </Button>
              <Button
                appearance="base"
                aria-controls="filter-group-reviewers"
                hasIcon
                onClick={handleFilterClick}
                small
              >
                <i className="p-icon--show" /> <span>By reviewer</span>
              </Button>
              <Button appearance="base" aria-controls="filter-group-product" hasIcon onClick={handleFilterClick} small>
                <i className="p-icon--repository" /> <span>By product</span>
              </Button>
            </div>
            <div className="col-4 p-divider__block">
              <form>{activeFiltergroup}</form>
            </div>
          </div>
          <hr />
          <div className="u-align--right">
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
  );
};

export default FiltersBox;
