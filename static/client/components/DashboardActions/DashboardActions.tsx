import type { ReactNode } from "react";
import { useMemo } from "react";

import ReportBugPanel from "@/components/ReportBugPanel";
import RequestFeaturePanel from "@/components/RequestFeaturePanel";
import { usePanelsStore } from "@/store/app";

const DashboardActions = (): ReactNode => {
  const [requestFeaturePanelVisible, reportBugPanelVisible] = usePanelsStore((state) => [
    state.requestFeaturePanelVisible,
    state.reportBugPanelVisible,
  ]);

  const isSidePanelOpen = useMemo(
    () => requestFeaturePanelVisible || reportBugPanelVisible,
    [reportBugPanelVisible, requestFeaturePanelVisible],
  );
  return (
    <div className="grid-row--25-75 u-sv1">
      <div className="grid-col">
        <p className="p-text--small-caps">Quick actions</p>
      </div>
      <div className="grid-col">
        <div className="grid-row">
          <div className={`grid-col-${isSidePanelOpen ? "3" : "2"}`}>
            <div className="p-card bug-report-card u-no-padding--top u-no-padding--bottom">
              <h4>Report a bug</h4>
              <p>Report a bug encountered on or across our sites</p>
              <ReportBugPanel />
            </div>
          </div>
          <div className={`grid-col-${isSidePanelOpen ? "3" : "2"}`}>
            <div className="p-card bug-report-card u-no-padding--top u-no-padding--bottom">
              <h4>Request a feature</h4>
              <p>Request features like adding redirects or adding side cards</p>
              <RequestFeaturePanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardActions;
