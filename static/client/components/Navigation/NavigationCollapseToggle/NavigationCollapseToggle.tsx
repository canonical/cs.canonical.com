import { type ReactNode } from "react";

import { Button, Icon, Tooltip } from "@canonical/react-components";
import classNames from "classnames";

const NavigationCollapseToggle = ({
  isCollapsed,
  onToggle,
  className,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}): ReactNode => {
  return (
    <Tooltip
      message={<>{!isCollapsed ? "collapse" : "expand"}</>}
      position="left"
      tooltipClassName="p-side-navigation--tooltip"
    >
      <Button
        appearance="base"
        aria-label={`${!isCollapsed ? "collapse" : "expand"} main navigation`}
        className={classNames("is-dense has-icon l-navigation-collapse-toggle", className)}
        onClick={(e) => {
          onToggle();
          // Make sure the button does not have focus
          // .l-navigation remains open with :focus-within
          e.stopPropagation();
          e.currentTarget.blur();
        }}
      >
        <Icon name="close" />
      </Button>
    </Tooltip>
  );
};

export default NavigationCollapseToggle;
