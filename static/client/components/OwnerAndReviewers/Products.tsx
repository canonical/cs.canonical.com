import { useCallback, useEffect, useState } from "react";

import type { MultiSelectItem } from "@canonical/react-components";
import { MultiSelect } from "@canonical/react-components";

import type { IProductsProps } from "./OwnerAndReviewers.types";

import { useProducts } from "@/services/api/hooks/products";
import { PagesServices } from "@/services/api/services/pages";
import type { ISetProducts } from "@/services/api/types/pages";

const Products = ({ page, onSelectProducts }: IProductsProps): JSX.Element => {
  const [products, setProducts] = useState<MultiSelectItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<MultiSelectItem[]>([]);
  const { data } = useProducts();

  useEffect(() => {
    if (data?.data?.length) {
      setProducts(
        data.data.map((p) => ({
          label: p.name,
          value: p.id,
        })),
      );
    }
  }, [data]);

  useEffect(() => {
    if (page && page.products) {
      setSelectedProducts(page.products.map((p) => ({ label: p.name, value: p.id })));
    }
  }, [page]);

  const onItemsUpdate = useCallback(
    (items: MultiSelectItem[]) => {
      setSelectedProducts(items);
      if (page?.id) {
        PagesServices.setProducts({
          webpage_id: page?.id,
          product_ids: items.map((p) => p.value),
        } as ISetProducts);
      }
      if (onSelectProducts) onSelectProducts(items);
    },
    [onSelectProducts, page?.id],
  );

  return products.length ? (
    <>
      <p className="p-text--small-caps" id="products-input">
        Products
      </p>
      <MultiSelect
        items={products}
        onItemsUpdate={onItemsUpdate}
        placeholder="Select products"
        selectedItems={selectedProducts}
        variant="condensed"
      />
    </>
  ) : (
    <></>
  );
};

export default Products;
