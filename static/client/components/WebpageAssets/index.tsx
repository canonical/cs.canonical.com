import React, { useCallback, useState } from "react";

import { Pagination, Spinner } from "@canonical/react-components";

import Asset from "./Asset";

import { useWebpageAssets } from "@/services/api/hooks/assets";
import type { IPage } from "@/services/api/types/pages";

const WebpageAssets: React.FC<{ page: IPage }> = ({ page }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: assetsData, isLoading } = useWebpageAssets(page.url ?? "", page.project?.name ?? "", currentPage, 12);

  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  if (isLoading) return <Spinner text="Loading assets ..." />;
  if (!assetsData?.assets?.length) return <></>;

  return (
    <div id="webpage-assets">
      <section className="p-section">
        <p className="p-text--small-caps u-sv1">Assets used: {assetsData.total}</p>
        <div className="grid-row--25-25-25-25">
          {assetsData.assets?.map((asset) => {
            return (
              <div className="grid-col" key={asset.id}>
                <div className="p-section--shallow">
                  <Asset asset={asset} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <Pagination
        centered
        currentPage={assetsData.page}
        itemsPerPage={assetsData.page_size}
        paginate={paginate}
        totalItems={assetsData.total}
      />
    </div>
  );
};

export default WebpageAssets;
