import React from "react";

import { Tooltip } from "@canonical/react-components";

interface IIconTextWithTooltipProps {
  text?: string;
  icon?: string;
  message?: string;
}

const IconTextWithTooltip: React.FC<IIconTextWithTooltipProps> = ({ text, icon, message }) => {
  return (
    <Tooltip message={message} zIndex={999}>
      <span className="u-has-icon">
        {text}&nbsp;
        {icon && <i className={`p-icon--${icon}`} />}
      </span>
    </Tooltip>
  );
};

export default IconTextWithTooltip;
