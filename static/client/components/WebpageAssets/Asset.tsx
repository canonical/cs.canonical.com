import React, { useMemo } from "react";

import type { IAsset } from "@/services/api/types/assets";

const Asset: React.FC<{ asset: IAsset }> = ({ asset }) => {
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
    </>
  );
};

export default Asset;
