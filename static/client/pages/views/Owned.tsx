import React, { useEffect } from "react";
import { VIEW_OWNED } from "@/config";
import { useStore } from "@/store";
import { useViewsStore } from "@/store/views";
import { ModularTable } from "@canonical/react-components";
import { TablePagination } from "@canonical/react-components";
import TableView from "@/components/Views/TableView";

const Owned: React.FC = () => {
  const [setView, setFilter] = useViewsStore((state) => [state.setView, state.setFilter]);
  const user = useStore((state) => state.user);

  const dynamicOwnedPagesData = [];
  const pageLimits = [30, 60, 90];

  const columns = useMemo(
    () => [
      { Header: "URL", accessor: "pageUrl" },
      { Header: "Title", accessor: "pageTitle" },
      { Header: "Status", accessor: "pageStatus" },
      { Header: "Actions", accessor: "pageActions" },
    ],
    [],
  );

  useEffect(() => {
    setView(VIEW_OWNED);
    setFilter({
      owners: [user.email],
      reviewers: [],
      products: [],
      query: "",
    });
    return () => {
      setFilter({
        owners: [],
        reviewers: [],
        products: [],
        query: "",
      });
    };
  }, [setFilter, setView, user.email]);

  useEffect(() => {}, [setView]);

  return (
    <div className="l-owned">
      <div>
        <h4>Your pages</h4>
        <ModularTable columns={columns} data={dynamicOwnedPagesData} />
      </div>
      <div className="l-owned__pagination">
        <hr />
        <TablePagination itemName="page" pageLimits={pageLimits} position="below" data={dynamicOwnedPagesData} />
      </div>
    </div>
  );
};

export default Owned;
