import { type ReactNode } from "react";

import { Button, Icon } from "@canonical/react-components";

import type { IProduct } from "@/services/api/types/products";

type ProductActionChipProps = {
  product: IProduct;
  onEdit: () => void;
  onDelete: () => void;
};

const ProductActionChip = ({ product, onEdit, onDelete }: ProductActionChipProps): ReactNode => {
  return (
    <>
      <div className="p-product-action-chip" data-id={product.id}>
        <div> {product.name}</div>
        <div className="p-product-action-chip__actions u-align--right">
          <Button
            appearance="base"
            aria-label={`Delete ${product.name}`}
            className="p-product-action-chip__edit u-no-margin"
            hasIcon
            onClick={onEdit}
          >
            <Icon name="edit" />
          </Button>
          <Button
            appearance="base"
            aria-label={`Delete ${product.name}`}
            className="p-product-action-chip__delete u-no-margin"
            hasIcon
            onClick={onDelete}
          >
            <Icon name="delete" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProductActionChip;
