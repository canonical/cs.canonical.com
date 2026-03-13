import { type ReactNode } from "react";

import { Button, Icon, Input } from "@canonical/react-components";

import HighlightedSearchText from "@/components/Common/HighlightedSearchText";
import type { IProduct } from "@/services/api/types/products";

type ProductActionChipProps = {
  product: IProduct;
  onEdit: () => void;
  onDelete: () => void;
  onChipClick?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isAdmin?: boolean;
  isSelected?: boolean;
  searchValue?: string;
};

const ProductActionChip = ({
  product,
  onEdit,
  onDelete,
  onChipClick,
  isAdmin,
  isSelected,
  searchValue = "",
}: ProductActionChipProps): ReactNode => {
  return (
    <div className="p-product-action-chip" data-id={product.id}>
      <Input
        checked={isSelected}
        label={<HighlightedSearchText highlight={searchValue} text={product.name} />}
        onChange={onChipClick}
        type="checkbox"
      />

      {isAdmin && (
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
      )}
    </div>
  );
};

export default ProductActionChip;
