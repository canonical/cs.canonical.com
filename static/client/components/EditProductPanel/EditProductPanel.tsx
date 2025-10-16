import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Button, SidePanel, Icon, List } from "@canonical/react-components";

import "./_EditProductPanel.scss";

import ProductActionChip from "./ProductActionChip";
import ProductActionModal from "./ProductActionModal";

import { ProductsServices } from "@/services/api/services/products";
import type { IProduct, IProductAction } from "@/services/api/types/products";
import { usePanelsStore } from "@/store/app";

const EditProductPanel = (): ReactNode => {
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [action, setAction] = useState<IProductAction>(null);
  const [productActionModalOpen, setProductActionModalOpen] = useState(false);

  const toggleActionModal = useCallback(() => setProductActionModalOpen((prev) => !prev), []);
  const [products, setProducts] = useState<IProduct[]>([]);

  const [productsPanelVisible, toggleProductsPanel] = usePanelsStore((state) => [
    state.productsPanelVisible,
    state.toggleProductsPanel,
  ]);

  useEffect(() => {
    const fetchProducts = async () => {
      const data = await ProductsServices.getProducts();
      setProducts(data?.data ?? []);
    };
    if (productsPanelVisible) fetchProducts();
  }, [productsPanelVisible]);

  const openProductActionModal = useCallback((product: IProduct | null, action: IProductAction) => {
    setProductActionModalOpen(true);
    setAction(action);
    setSelectedProduct(product);
  }, []);

  return (
    <>
      {productActionModalOpen && (
        <ProductActionModal
          action={action}
          closeProductPanel={toggleProductsPanel}
          onClose={toggleActionModal}
          product={selectedProduct}
        />
      )}
      <SidePanel isOpen={productsPanelVisible} pinned>
        <SidePanel.Sticky>
          <div className="p-section--shallow">
            <SidePanel.Header>
              <SidePanel.HeaderTitle>Edit product labels</SidePanel.HeaderTitle>
              <SidePanel.HeaderControls>
                <Button
                  appearance="base"
                  aria-label="Close"
                  className="u-no-margin--bottom"
                  hasIcon
                  onClick={toggleProductsPanel}
                >
                  <Icon name="close" />
                </Button>
              </SidePanel.HeaderControls>
            </SidePanel.Header>
          </div>
        </SidePanel.Sticky>
        <div className="u-align--right">
          <Button appearance="" hasIcon onClick={() => openProductActionModal(null, "add")}>
            <i className="p-icon--plus" /> <span>Add new product tag</span>
          </Button>
        </div>
        <p className="p-text--small-caps"> Product tag</p>
        <SidePanel.Content className="u-no-padding p-side-panel--content">
          <List
            className="u-no-margin--bottom"
            divided={true}
            items={products.map((product) => (
              <ProductActionChip
                key={product.id}
                onDelete={() => openProductActionModal(product, "delete")}
                onEdit={() => openProductActionModal(product, "edit")}
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
