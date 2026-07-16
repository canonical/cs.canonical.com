import React, { useMemo } from "react";

import { Button, Tooltip } from "@canonical/react-components";

import type { IAsset } from "@/services/api/types/assets";
import "./_Asset.scss";

const Asset: React.FC<{ asset: IAsset }> = ({ asset }) => {
  const isImgFile = useMemo(() => {
    return [".jpg", ".jpeg", ".png", ".gif", ".svg"].includes(asset.type.toLowerCase());
  }, [asset.type]);

  const openAsset = () => {
    return window.open(asset.url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="p-image-container--3-2 p-asset__image">
        <img
          alt=""
          className="p-image-container__image"
          src={isImgFile ? asset.url : "https://assets.ubuntu.com/v1/fd84bbdc-Document-open.svg"}
        />
        <Button className="p-asset__external-link" hasIcon onClick={openAsset}>
          <Tooltip message="View on asset manager" position="btm-left">
            <i className="p-icon--external-link" />
          </Tooltip>
        </Button>

        {/* <Tooltip message="Open in new tab" position="top-right">
          <a className="p-asset__external-link" href={asset.url} rel="noopener noreferrer" target="_blank">
            <Icon name="external-link" />
          </a>
        </Tooltip> */}
      </div>
    </>
  );
};

export default Asset;
