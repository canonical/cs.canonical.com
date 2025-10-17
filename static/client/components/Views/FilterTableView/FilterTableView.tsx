import { useMemo, type ReactNode } from "react";

import { useLocation } from "react-router-dom";

import FilterandSearch from "./FilterandSearch";

import DashboardActions from "@/components/DashboardActions";
import TableView from "@/components/Views/TableView";
import { VIEW_OWNED, VIEW_REVIEWED } from "@/config";
import { useViewsStore } from "@/store/views";

const FilterTableView = (): ReactNode => {
  const location = useLocation();
  const view = useViewsStore((state) => state.view);

  const viewTitle = useMemo(() => {
    if (location.pathname === "/app") return "All pages";
    switch (view) {
      case VIEW_OWNED:
        return "Owned by me";
      case VIEW_REVIEWED:
        return "Reviewed by me";
      default:
        return "All pages";
    }
  }, [location.pathname, view]);

  const showQuickActions = useMemo(() => {
    return location.pathname === "/app";
  }, [location.pathname]);
  return (
    <>
      {showQuickActions && (
        <>
          <DashboardActions />
          <hr className="p-rule" />
        </>
      )}

      <h2>{viewTitle}</h2>
      <FilterandSearch />
      <TableView />
    </>
  );
};
export default FilterTableView;
