import React, { useMemo } from "react";

import type { IAsset } from "@/services/api/types/assets";

const Asset: React.FC<{ asset: IAsset }> = ({ asset }) => {
  const assetName = useMemo(() => {
    return asset.url.split("/v1/")[1];
  }, [asset.url]);

  return (
    <>
      <div className="p-image-container--3-2">
        <img alt="" className="p-image-container__image" src={asset.url} />
      </div>
      <div className="asset-name">
        <b>{assetName}</b>
      </div>
      <div className="asset-type">
        <p>
          File type: <b>{asset.type}</b>
        </p>
      </div>
      <div className="asset-cta">
        <div className="p-cta-block">
          <a
            className="p-button--positive"
            href={`https://assets.ubuntu.com/manager/details?file-path=${assetName}`}
            rel="noreferrer"
            target="_blank"
          >
            View
          </a>
          <a
            className="p-button"
            href={`https://assets.ubuntu.com/manager/update?file-path=${assetName}`}
            rel="noreferrer"
            target="_blank"
          >
            Edit
          </a>
        </div>
      </div>
    </>
  );
};

export default Asset;
