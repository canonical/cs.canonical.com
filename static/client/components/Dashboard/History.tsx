import React, { useState } from "react";

import { Spinner, TablePagination, Tabs } from "@canonical/react-components";
import { Link } from "react-router-dom";

import JiraTasks from "@/components/JiraTasks";
import { useTickets } from "@/services/api/hooks/tickets";

const RequestHistory = () => {
  const tabs = [
    {
      label: "Active",
      slug: "active",
    },
    {
      label: "Resolved",
      slug: "resolved",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [currentTab, setCurrentTab] = useState("active");
  const { data, isLoading } = useTickets(currentPage, pageSize, currentTab);

  return (
    <div>
      <h5 className="p-text--small-caps">Your requests</h5>
      <Tabs
        className={`is-sticky`}
        links={tabs.map((tab) => ({
          component: Link,
          label: tab.label,
          active: tab.slug === currentTab,
          onClick: () => setCurrentTab(tab.slug),
        }))}
      />

      {isLoading && <Spinner text="Loading requests..." />}
      {data && !data.tickets?.length && <p>You don't have any requests yet.</p>}

      {data && (
        <>
          <section className="p-section">
            <JiraTasks tasks={data.tickets} />
          </section>

          <hr />
          <TablePagination
            currentPage={data.page}
            data={data.tickets}
            externallyControlled={true}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageLimits={[10, 20, 30]}
            pageSize={data.page_size}
            totalItems={data.total}
          />
        </>
      )}
    </div>
  );
};

export default RequestHistory;
