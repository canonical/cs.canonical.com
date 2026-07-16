import { useEffect } from "react";

import { useLocation } from "react-router-dom";

import NewWebpagePanel from "@/components/NewWebpagePanel";
import ReportBugPanel from "@/components/ReportBugPanel";
import RequestFeaturePanel from "@/components/RequestFeaturePanel";
import { usePanelsStore } from "@/store/app";

const AppPanels = () => {
  const location = useLocation();
  const togglePanel = usePanelsStore((state) => state.togglePanel);

  useEffect(() => {
    if (location.state?.panelToOpen) {
      const timer = setTimeout(() => {
        togglePanel(location.state.panelToOpen);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location, togglePanel]);

  return (
    <>
      <RequestFeaturePanel />
      <ReportBugPanel />
      <NewWebpagePanel />
    </>
  );
};

export default AppPanels;
