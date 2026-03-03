import React, { useCallback, useState } from "react";

import { Spinner, TablePagination } from "@canonical/react-components";

import Asset from "./Asset";

import { useWebpageAssets } from "@/services/api/hooks/assets";

interface WebpageAssetsProps {
  url?: string;
  projectName?: string;
}

const WebpageAssets: React.FC<WebpageAssetsProps> = ({ url = "", projectName = "" }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const { data: assetsData, isLoading } = useWebpageAssets(url, projectName, currentPage, pageSize);

  const paginate = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  if (isLoading) return <Spinner text="Loading assets ..." />;
  if (!assetsData?.assets?.length) return null;

  return (
    <div id="webpage-assets">
      <section>
        <p className="p-text--small-caps u-sv1">Assets used</p>
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
        {assetsData.total > assetsData.page_size && (
          <TablePagination
            currentPage={assetsData.page}
            data={assetsData.assets}
            description={`Showing ${Math.min(assetsData.page * assetsData.page_size, assetsData.total)} out of ${assetsData.total} assets`}
            externallyControlled
            onPageChange={paginate}
            onPageSizeChange={handlePageSizeChange}
            pageLimits={[4]}
            pageSize={assetsData.page_size}
            totalItems={assetsData.total}
          />
        )}
      </section>
      <hr className="p-rule" />
    </div>
  );
};

export default WebpageAssets;
