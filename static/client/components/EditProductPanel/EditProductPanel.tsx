import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Button, SidePanel, Icon, List } from "@canonical/react-components";

import "./_EditProductPanel.scss";

import ProductActionChip from "./ProductActionChip";
import ProductActionModal from "./ProductActionModal";

import { ProductsServices } from "@/services/api/services/products";
import type { IProduct, IProductAction } from "@/services/api/types/products";

interface EditProductPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProductPanel = ({ isOpen, onClose }: EditProductPanelProps): ReactNode => {
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [action, setAction] = useState<IProductAction>(null);
  const [productActionModalOpen, setProductActionModalOpen] = useState(false);

  const toggleActionModal = useCallback(() => setProductActionModalOpen((prev) => !prev), []);
  const [products, setProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const data = await ProductsServices.getProducts();
      setProducts(data?.data ?? []);
    };
    if (isOpen) fetchProducts();
  }, [isOpen]);

  const openEditProductModal = useCallback((product: IProduct | null) => {
    setProductActionModalOpen(true);
    setAction("edit");
    setSelectedProduct(product);
  }, []);
  const openDeleteProductModal = useCallback((product: IProduct) => {
    setProductActionModalOpen(true);
    setAction("delete");
    setSelectedProduct(product);
  }, []);

  const openAddProductModal = useCallback(() => {
    setProductActionModalOpen(true);
    setAction("add");
    setSelectedProduct(null);
  }, []);

  return (
    <>
      {productActionModalOpen && (
        <ProductActionModal
          action={action}
          closeProductPanel={onClose}
          onClose={toggleActionModal}
          product={selectedProduct}
        />
      )}
      <SidePanel isOpen={isOpen} pinned>
        <SidePanel.Sticky>
          <div className="p-section--shallow">
            <SidePanel.Header>
              <SidePanel.HeaderTitle>Edit product labels</SidePanel.HeaderTitle>
              <SidePanel.HeaderControls>
                <Button appearance="base" aria-label="Close" className="u-no-margin--bottom" hasIcon onClick={onClose}>
                  <Icon name="close" />
                </Button>
              </SidePanel.HeaderControls>
            </SidePanel.Header>
          </div>
        </SidePanel.Sticky>
        <div className="u-align--right">
          <Button appearance="" hasIcon onClick={openAddProductModal}>
            <i className="p-icon--plus" /> <span>Add new product tag</span>
          </Button>
        </div>
        <p className="p-text--small-caps"> Product tag</p>
        <SidePanel.Content className="u-no-padding p-side-panel--content">
          <List
            divided={true}
            items={products.map((product) => (
              <ProductActionChip
                key={product.id}
                onDelete={() => openDeleteProductModal(product)}
                onEdit={() => openEditProductModal(product)}
                product={product}
              />
            ))}
          />
        </SidePanel.Content>
      </SidePanel>
    </>
  );
};

export default EditProductPanel;
