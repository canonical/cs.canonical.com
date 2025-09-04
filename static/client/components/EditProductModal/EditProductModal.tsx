import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Button, SidePanel, Icon, List } from "@canonical/react-components";

import "./_EditProductModal.scss";

import ProductActionChip from "./ProductActionChip";
import ProductActionModal from "./ProductActionModal";

import { useProducts } from "@/services/api/hooks/products";
import type { IProduct, IProductAction } from "@/services/api/types/products";

const EditProductModal = ({ isOpen, onClose }): ReactNode => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [productActionModalOpen, setProductActionModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [action, setAction] = useState<IProductAction>(null);
  const toggleActionModal = useCallback(() => setProductActionModalOpen((prev) => !prev), []);
  const { data } = useProducts();

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

  useEffect(() => {
    if (data?.data?.length) {
      setProducts(
        data.data.map((p) => ({
          name: p.name,
          id: p.id,
        })),
      );
    }
  }, [data]);
  return (
    <>
      {productActionModalOpen && (
        <ProductActionModal action={action} onClose={toggleActionModal} product={selectedProduct} />
      )}
      <SidePanel className="p-side-panel" isOpen={isOpen} overlay>
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
                id={product.id}
                key={product.id}
                name={product.name}
                onDelete={() => openDeleteProductModal(product)}
                onEdit={() => openEditProductModal(product)}
              />
            ))}
          />
        </SidePanel.Content>
      </SidePanel>
    </>
  );
};

export default EditProductModal;
