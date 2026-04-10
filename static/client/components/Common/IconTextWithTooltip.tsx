import React from "react";

import { Tooltip } from "@canonical/react-components";
import type { Position } from "@canonical/react-components/dist/components/Tooltip/Tooltip";

interface IIconTextWithTooltipProps {
  text?: string;
  icon?: string;
  message?: string | Array<string>;
  position?: Position;
}

const IconTextWithTooltip: React.FC<IIconTextWithTooltipProps> = ({ text, icon, message, position }) => {
  return (
    <Tooltip message={Array.isArray(message) ? message.join("\n") : message} position={position} zIndex={999}>
      <span className="u-has-icon" tabIndex={0}>
        {text}
        {icon && <i className={`p-icon--${icon}`} />}
      </span>
    </Tooltip>
  );
};

export default IconTextWithTooltip;
