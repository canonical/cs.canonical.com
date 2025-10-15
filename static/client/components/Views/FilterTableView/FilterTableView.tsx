import { type ReactNode } from "react";

import FilterandSearch from "./FilterandSearch";

import ReportBugPanel from "@/components/ReportBugPanel";
import RequestFeaturePanel from "@/components/RequestFeaturePanel";
import TableView from "@/components/Views/TableView";

const FilterTableView = (): ReactNode => {
  return (
    <>
      <FilterandSearch />
      <hr className="p-rule" />
      <div className="grid-row--25-75">
        <div className="grid-col">
          <p className="p-text--small-caps">Quick actions</p>
        </div>
        <div className="grid-col">
          <div className="grid-row">
            <div className="grid-col-2">
              <div className="p-card bug-report-card">
                <h4>Report a bug</h4>
                <p>Report a bug encountered on or across our sites</p>
                <ReportBugPanel />
              </div>
            </div>
            <div className="grid-col-2">
              <div className="p-card bug-report-card">
                <h4>Request a feature</h4>
                <p>Request features like adding redirects or adding side cards</p>
                <RequestFeaturePanel />
              </div>
            </div>
          </div>
        </div>
      </div>
      <TableView />
    </>
  );
};
export default FilterTableView;
