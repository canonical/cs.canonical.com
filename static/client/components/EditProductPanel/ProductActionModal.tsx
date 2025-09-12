import { useCallback, useState, type ReactNode } from "react";

import { Modal, Button, Input, useNotify, Spinner } from "@canonical/react-components";
import { useQueryClient } from "react-query";

import { ProductsServices } from "@/services/api/services/products";
import type { IProduct, IProductAction } from "@/services/api/types/products";

interface ProductActionModalProps {
  product: IProduct | null;
  onClose: () => void;
  action: IProductAction;
  closeProductPanel: () => void;
}

const ProductActionModal = ({ product, onClose, action, closeProductPanel }: ProductActionModalProps): ReactNode => {
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState(product?.name || "");
  const queryClient = useQueryClient();

  let actionButton = null;
  let content = null;
  let heading = "";
  const notify = useNotify();
  const handleAction = useCallback(async () => {
    setIsLoading(true);
    try {
      if (action === "edit" && product) {
        await ProductsServices.editProduct(product.id, newName);
      } else if (action === "delete" && product) {
        await ProductsServices.deleteProduct(product.id);
      } else if (action === "add") {
        await ProductsServices.addProduct(newName);
      }

      await queryClient.invalidateQueries("products");
      await queryClient.refetchQueries("products");
      onClose();
      closeProductPanel();
      notify.success(
        `${action === "delete" ? product?.name : newName} was successfully ${
          action === "add" ? "created" : action === "edit" ? "updated" : "deleted"
        }.`,
      );
    } catch (error) {
      notify.failure(`There was an error trying to ${action} the product. Please try again.`, null, null);
    } finally {
      setIsLoading(false);
    }
  }, [action, product, queryClient, onClose, closeProductPanel, notify, newName]);

  if (action === "edit") {
    heading = `Edit tag`;
    actionButton = (
      <Button appearance="positive" onClick={handleAction}>
        {isLoading ? <Spinner isLight={true} /> : "Update"}
      </Button>
    );
    content = (
      <Input
        error={!newName.trim() ? "Tag name cannot be empty" : ""}
        label="Tag Name"
        onChange={(e) => setNewName(e.target.value)}
        type="text"
        value={newName}
      />
    );
  } else if (action === "delete") {
    heading = `Delete tag`;
    actionButton = (
      <Button appearance="negative" onClick={handleAction}>
        {isLoading ? <Spinner isLight={true} /> : "Delete"}
      </Button>
    );
    content = (
      <p>
        Are you sure you would like to delete the {product?.name} tag? This will permanently delete the tag from every
        page it is currently being used.
      </p>
    );
  } else if (action === "add") {
    heading = `Add tag`;

    actionButton = (
      <Button appearance="positive" onClick={handleAction}>
        {isLoading ? <Spinner isLight={true} /> : "Create"}
      </Button>
    );
    content = (
      <Input
        error={!newName.trim() ? "Tag name cannot be empty" : ""}
        label="Tag Name"
        onChange={(e) => setNewName(e.target.value)}
        type="text"
        value={newName}
      />
    );
  }

  return (
    <Modal
      buttonRow={
        <>
          <button className="u-no-margin--bottom" onClick={onClose}>
            Cancel
          </button>
          {actionButton}
        </>
      }
      close={onClose}
      closeOnOutsideClick={true}
      title={heading}
    >
      {content}
    </Modal>
  );
};

export default ProductActionModal;
