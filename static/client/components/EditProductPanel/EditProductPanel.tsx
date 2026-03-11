import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { Button, SidePanel, Icon, List, useToastNotification } from "@canonical/react-components";
import { Link } from "react-router-dom";

import ProductActionChip from "./ProductActionChip";
import ProductActionModal from "./ProductActionModal";

import CustomSearchAndFilter from "@/components/Common/CustomSearchAndFilter";
import { useProducts } from "@/services/api/hooks/products";
import { PagesServices } from "@/services/api/services/pages";
import type { IPage } from "@/services/api/types/pages";
import type { IProduct, IProductAction } from "@/services/api/types/products";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";

const EditProductPanel = ({ page }: { page: IPage }): ReactNode => {
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [action, setAction] = useState<IProductAction>(null);
  const [productActionModalOpen, setProductActionModalOpen] = useState(false);
  const user = useStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const { data: products = [] } = useProducts();

  const toggleActionModal = useCallback(() => setProductActionModalOpen((prev) => !prev), []);

  const [productsPanelVisible, toggleProductsPanel, toggleRequestFeaturePanel] = usePanelsStore((state) => [
    state.productsPanelVisible,
    state.toggleProductsPanel,
    state.toggleRequestFeaturePanel,
  ]);

  function openProductActionModal(product: IProduct | null, action: IProductAction) {
    setProductActionModalOpen(true);
    setAction(action);
    setSelectedProduct(product);
  }

  const [selectedProducts, setSelectedProducts] = useState<IProduct[]>([]);
  const notify = useToastNotification();

  function onSearchTags(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function onTagChipClick(e: React.ChangeEvent<HTMLInputElement>, product: IProduct) {
    const isChecked = e.target.checked;
    if (isChecked) {
      setSelectedProducts((prev) => [...prev, product]);
    } else {
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
    }
  }

  const onRemoveTag = useCallback((product: IProduct) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
  }, []);

  function onRequestFeature() {
    toggleRequestFeaturePanel();
  }

  function onSave() {
    page.products = selectedProducts.map((p) => ({ name: p.name, id: p.id }) as IProduct);
    PagesServices.setProducts({
      webpage_id: page.id as number,
      product_ids: selectedProducts.map((p) => p.id),
    })
      .then(() => {
        notify.success("Products tags updated successfully.");
        toggleProductsPanel();
      })
      .catch((error) => {
        notify.failure(error.response.data?.error, null, <p>{error.response.data?.description}</p>);
      });
  }

  useEffect(() => {
    setSelectedProducts(page.products as IProduct[]);
    setSearch("");
  }, [page, productsPanelVisible]);

  const filteredProductItems = useMemo(
    () =>
      products
        .filter((product) => product.name.toLowerCase().includes(search.toLowerCase()))
        .map((product) => (
          <ProductActionChip
            isAdmin={isAdmin}
            isSelected={selectedProducts.find((p) => p.id === product.id) !== undefined}
            key={product.id}
            onChipClick={(e) => {
              onTagChipClick(e, product);
            }}
            onDelete={() => openProductActionModal(product, "delete")}
            onEdit={() => openProductActionModal(product, "edit")}
            product={product}
          />
        )),
    [products, search, isAdmin, selectedProducts],
  );

  return (
    <>
      {productActionModalOpen && (
        <ProductActionModal action={action} onClose={toggleActionModal} product={selectedProduct} />
      )}
      <SidePanel isOpen={productsPanelVisible}>
        <SidePanel.Sticky>
          <SidePanel.Header>
            <SidePanel.HeaderTitle>Edit tags</SidePanel.HeaderTitle>
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
        </SidePanel.Sticky>

        <CustomSearchAndFilter<IProduct>
          label=""
          onChange={onSearchTags}
          onRemove={onRemoveTag}
          onSelect={() => {}}
          options={products}
          placeholder="Search"
          resetOnClickOutside={false}
          selectedOptions={selectedProducts}
          showPanel={false}
        />

        {isAdmin ? (
          <div className="u-align--right p-new-tag-button">
            <Button appearance="base" hasIcon onClick={() => openProductActionModal(null, "add")}>
              <i className="p-icon--plus" /> <span>Add new product tag</span>
            </Button>
          </div>
        ) : (
          <p className="p-new-tag-text">
            To edit a product tag, please{" "}
            <Link onClick={onRequestFeature} to="/app">
              submit a feature request
            </Link>
          </p>
        )}

        <SidePanel.Content className="u-no-padding p-side-panel--content">
          <List className="u-no-margin--bottom" divided={true} items={filteredProductItems} />
        </SidePanel.Content>
        <SidePanel.Sticky position="bottom">
          <SidePanel.Footer className="u-align--right">
            <Button appearance="base" onClick={toggleProductsPanel}>
              Cancel
            </Button>
            <Button appearance="positive" onClick={onSave}>
              Save changes
            </Button>
          </SidePanel.Footer>
        </SidePanel.Sticky>
      </SidePanel>
    </>
  );
};

export default EditProductPanel;
