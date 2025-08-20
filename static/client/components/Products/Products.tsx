import { useCallback, useEffect, useState, type ReactNode } from "react";

import type { MultiSelectItem } from "@canonical/react-components";
import { MultiSelect } from "@canonical/react-components";

import type { IProductsProps } from "./Products.types";

import { useProducts } from "@/services/api/hooks/products";
import { PagesServices } from "@/services/api/services/pages";
import type { ISetProducts } from "@/services/api/types/pages";
import type { IProduct } from "@/services/api/types/products";

const Products = ({ page, onSelectProducts }: IProductsProps): ReactNode => {
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
        page.products = items.map((p) => ({ name: p.label, id: p.value }) as IProduct);
        PagesServices.setProducts({
          webpage_id: page?.id,
          product_ids: items.map((p) => p.value),
        } as ISetProducts);
      }
      if (onSelectProducts) onSelectProducts(items);
    },
    [onSelectProducts, page],
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
        scrollOverflow
        selectedItems={selectedProducts}
        variant="condensed"
      />
    </>
  ) : (
    <></>
  );
};

export default Products;
