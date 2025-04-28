import React, { useEffect, useState, memo } from "react";

import { SearchBox, Input } from "@canonical/react-components";

import { useProducts } from "@/services/api/hooks/products";
import type { IProduct } from "@/services/api/types/products";

type SearchProductCheckboxProps = {
  state: string[];
  setState: React.Dispatch<React.SetStateAction<string[]>>;
};

function SearchProductCheckbox({ state, setState }: SearchProductCheckboxProps): JSX.Element {
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);
  const { data } = useProducts();

  useEffect(() => {
    if (data?.data?.length) {
      const productData = data.data.map((p) => ({ name: p.name, id: p.id }));
      setAllProducts(productData);
      setSearchedProducts(productData);
    }
  }, [data]);
  console.log("check and search");
  const [searchedProducts, setSearchedProducts] = useState<IProduct[]>([]);
  return (
    <div>
      <SearchBox
        className="filter-search"
        externallyControlled={true}
        onChange={(s: string) => {
          if (s.length >= 2) {
            const filteredProducts = allProducts.filter((product) =>
              product.name.toLowerCase().includes(s.toLowerCase()),
            );
            setSearchedProducts(filteredProducts);
          } else {
            setSearchedProducts([...allProducts]);
          }
        }}
      />
      <div className="u-sv3 p-filter__group">
        {searchedProducts.map((product) => (
          <Input
            checked={state.includes(product.name)}
            key={product.id}
            label={product.name}
            onChange={() => {
              if (state.includes(product.name)) {
                setState(state.filter((sel_product) => sel_product !== product.name));
              } else {
                setState([...state, product.name]);
              }
            }}
            type="checkbox"
          />
        ))}
      </div>
    </div>
  );
}

export default memo(SearchProductCheckbox);
