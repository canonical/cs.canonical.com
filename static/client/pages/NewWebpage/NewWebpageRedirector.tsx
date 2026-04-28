import { useEffect } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import { VIEW_REQUESTS } from "@/config";
import { useViewsStore } from "@/store/views";

const NewWebpageRedirector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const setView = useViewsStore((state) => state.setView);

  useEffect(() => {
    setView(VIEW_REQUESTS);
    navigate(
      {
        pathname: "/app",
        search: location.search,
      },
      { replace: true, state: { panelToOpen: "newWebpagePanelVisible" } },
    );
  }, [navigate, location, setView]);

  return null;
};

export default NewWebpageRedirector;
