import React, { useState } from "react";

import { Button } from "@canonical/react-components";

import type { IProduct } from "@/services/api/types/products";

interface ProductsProps {
  products: IProduct[];
}

const Products: React.FC<ProductsProps> = ({ products }) => {
  const [showMore, setShowMore] = useState(false);

  const toggleShowMore = () => {
    setShowMore((prev) => !prev);
  };

  const getProducts = () => {
    let productNames = products?.map((product) => product.name) || [];
    if (productNames.length <= 3) {
      return productNames.join(", ");
    }
    return (
      <>
        {showMore ? productNames.join(", ") : productNames.slice(0, 3).join(", ")}
        <br />
        <Button appearance="link" onClick={toggleShowMore}>
          {showMore ? "Show less" : `Show ${productNames.length - 3} more`}
        </Button>
      </>
    );
  };

  return <>{getProducts()}</>;
};

export default Products;
