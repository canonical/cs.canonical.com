import type { ReactNode } from "react";

import ReportBugPanel from "@/components/ReportBugPanel";
import RequestFeaturePanel from "@/components/RequestFeaturePanel";

const DashboardActions = (): ReactNode => {
  return (
    <div className="grid-row">
      <h4 className="u-sv3">Main menu</h4>
      <div className="grid-col-2">
        <div className="p-card report-card">
          <h5>Report a bug</h5>
          <p>Report a bug encountered on or across our sites</p>
          <ReportBugPanel />
        </div>
      </div>
      <div className="grid-col-2">
        <div className="p-card report-card">
          <h5>Request a feature</h5>
          <p>Request features like adding redirects or adding side cards</p>
          <RequestFeaturePanel />
        </div>
      </div>
    </div>
  );
};

export default DashboardActions;
