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
  const [inputError, setInputError] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  let actionButton = null;
  let heading = "";
  const spinner = <Spinner isLight={true} />;
  let content = (
    <Input
      error={inputError}
      label="Tag Name"
      onChange={(e) => {
        if (e.target.value.trim() === "") {
          setInputError("Product name cannot be empty");
        } else {
          setInputError(null);
        }
        setNewName(e.target.value);
      }}
      type="text"
      value={newName}
    />
  );

  if (action === "edit") {
    heading = `Edit tag`;
    actionButton = (
      <Button
        appearance="positive"
        className="u-no-margin--bottom"
        disabled={newName.length === 0 || newName === product?.name}
        onClick={handleAction}
      >
        {isLoading ? spinner : "Update"}
      </Button>
    );
  } else if (action === "delete") {
    heading = `Delete tag`;
    actionButton = (
      <Button appearance="negative" className="u-no-margin--bottom" onClick={handleAction}>
        {isLoading ? spinner : "Delete"}
      </Button>
    );
    content = (
      <p>
        Are you sure you would like to delete the <b>{product?.name}</b> tag? This will permanently delete the tag from
        every page it is currently being used.
      </p>
    );
  } else if (action === "add") {
    heading = `Add tag`;
    actionButton = (
      <Button
        appearance="positive"
        className="u-no-margin--bottom"
        disabled={newName.length === 0}
        onClick={handleAction}
      >
        {isLoading ? spinner : "Create"}
      </Button>
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
      className={"p-product-modal"}
      close={onClose}
      closeOnOutsideClick={true}
      title={heading}
    >
      {content}
    </Modal>
  );
};

export default ProductActionModal;
