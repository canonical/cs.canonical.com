import type { ReactNode } from "react";

import { Button } from "@canonical/react-components";

import ReportBugPanel from "@/components/ReportBugPanel";
import RequestFeaturePanel from "@/components/RequestFeaturePanel";
import RequestRemovalPanel from "@/components/RequestRemovalPanel";
import { usePanelsStore } from "@/store/app";

const DashboardActions = (): ReactNode => {
  const toggleRequestRemovalPanel = usePanelsStore((state) => state.toggleRequestRemovalPanel);

  return (
    <div className="grid-row u-no-padding">
      <h4 className="u-sv3 u-no-padding--top">Main menu</h4>
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
      <div className="grid-col-2">
        <div className="p-card report-card">
          <h5>Request page removal</h5>
          <p>Request removal of a page from our website</p>
          <Button onClick={toggleRequestRemovalPanel}>Request removal</Button>
          <RequestRemovalPanel />
        </div>
      </div>
    </div>
  );
};

export default DashboardActions;
