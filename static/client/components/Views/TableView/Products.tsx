import React, { useState } from "react";

import { Button } from "@canonical/react-components";

import type { IPage } from "@/services/api/types/pages";

interface ProductsProps {
  page: IPage;
}

const Products: React.FC<ProductsProps> = ({ page }) => {
  const [showMore, setShowMore] = useState(false);

  const toggleShowMore = () => {
    setShowMore((prev) => !prev);
  };

  const getProducts = () => {
    let products = page?.products?.map((product) => product.name) || [];
    if (products.length <= 3) {
      return products.join(", ");
    }
    return (
      <>
        {showMore ? products.join(", ") : products.slice(0, 3).join(", ")}
        <br />
        <Button appearance="link" onClick={toggleShowMore}>
          {showMore ? "Show less" : `Show ${products.length - 3} more`}
        </Button>
      </>
    );
  };

  return <>{getProducts()}</>;
};

export default Products;
