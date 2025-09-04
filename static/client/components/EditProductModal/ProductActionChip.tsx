import { type ReactNode } from "react";

import { Button, Icon } from "@canonical/react-components";

const ProductActionChip = ({ name, id, onEdit, onDelete }): ReactNode => {
  return (
    <>
      <div className="p-product-action-chip" data-id={id}>
        <div> {name}</div>
        <div className="p-product-action-chip__actions u-align--right">
          <Button
            appearance="base"
            aria-label={`Delete ${name}`}
            className="p-product-action-chip__edit u-no-margin"
            hasIcon
            onClick={onEdit}
          >
            <Icon name="edit" />
          </Button>
          <Button
            appearance="base"
            aria-label={`Delete ${name}`}
            className="p-product-action-chip__delete u-no-margin"
            hasIcon
            onClick={onDelete}
          >
            <Icon name="archive" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProductActionChip;
