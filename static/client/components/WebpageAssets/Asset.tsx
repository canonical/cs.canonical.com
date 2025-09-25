import React, { useMemo } from "react";

import config from "@/config";
import type { IAsset } from "@/services/api/types/assets";

const Asset: React.FC<{ asset: IAsset }> = ({ asset }) => {
  const assetName = useMemo(() => {
    return asset.url.split("/v1/")[1];
  }, [asset.url]);

  const isImgFile = useMemo(() => {
    return [".jpg", ".jpeg", ".png", ".gif", ".svg"].includes(asset.type.toLowerCase());
  }, [asset.type]);

  return (
    <>
      <div className="p-image-container--3-2 p-asset__image">
        <img
          alt=""
          className="p-image-container__image"
          src={isImgFile ? asset.url : "https://assets.ubuntu.com/v1/fd84bbdc-Document-open.svg"}
        />
      </div>
      <div className="asset-name u-truncate">
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
            href={`${config.assetsManagerUrl}/details?file_path=${assetName}`}
            rel="noreferrer"
            target="_blank"
          >
            View
          </a>
          <a
            className="p-button"
            href={`${config.assetsManagerUrl}/update?file_path=${assetName}`}
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
