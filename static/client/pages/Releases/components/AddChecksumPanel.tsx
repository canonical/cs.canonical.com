import { type ReactNode, useEffect, useState } from "react";

import { ActionButton, Button, Icon, Input, Select, SidePanel } from "@canonical/react-components";

import { usePanelsStore } from "@/store/app";

export interface IChecksumEditTarget {
  category: string;
  version: string;
  hash: string;
}

interface IAddChecksumPanelProps {
  categories: string[];
  editTarget: IChecksumEditTarget | null;
  onSave: (category: string, version: string, hash: string) => void;
  onCancel: () => void;
}

const AddChecksumPanel = ({ categories, editTarget, onSave, onCancel }: IAddChecksumPanelProps): ReactNode => {
  const addChecksumPanelVisible = usePanelsStore((state) => state.addChecksumPanelVisible);

  const [selectedCategory, setSelectedCategory] = useState(categories[0] ?? "");
  const [version, setVersion] = useState("");
  const [hash, setHash] = useState("");

  // Reset or pre-fill form when panel opens / edit target changes
  useEffect(() => {
    if (addChecksumPanelVisible) {
      if (editTarget) {
        setSelectedCategory(editTarget.category);
        setVersion(editTarget.version);
        setHash(editTarget.hash);
      } else {
        setSelectedCategory(categories[0] ?? "");
        setVersion("");
        setHash("");
      }
    }
  }, [addChecksumPanelVisible, editTarget, categories]);

  const isValid = Boolean(selectedCategory && version.trim() && hash.trim());

  const handleSave = () => {
    if (isValid) {
      onSave(selectedCategory, version.trim(), hash.trim());
    }
  };

  return (
    <SidePanel isOpen={addChecksumPanelVisible} overlay>
      <SidePanel.Sticky>
        <div>
          <SidePanel.Header>
            <SidePanel.HeaderTitle>{editTarget ? "Edit checksum" : "Add checksum"}</SidePanel.HeaderTitle>
            <SidePanel.HeaderControls>
              <Button appearance="base" aria-label="Close" className="u-no-margin--bottom" hasIcon onClick={onCancel}>
                <Icon name="close" />
              </Button>
            </SidePanel.HeaderControls>
          </SidePanel.Header>
        </div>
      </SidePanel.Sticky>
      <SidePanel.Content>
        <ol className="l-add-checksum-panel__steps">
          <li>
            <Select
              label="Select target image"
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={categories.map((cat) => ({ label: cat, value: cat }))}
              value={selectedCategory}
            />
          </li>
          <li>
            <Input
              label="Specify version"
              onChange={(e) => setVersion(e.target.value)}
              placeholder="25.10"
              type="text"
              value={version}
            />
          </li>
          <li>
            <Input
              label="Add checksum"
              onChange={(e) => setHash(e.target.value)}
              placeholder="Insert value"
              type="text"
              value={hash}
            />
          </li>
        </ol>
      </SidePanel.Content>
      <SidePanel.Sticky position="bottom">
        <SidePanel.Footer className="u-align--right">
          <Button className="u-no-margin--bottom" onClick={onCancel}>
            Cancel
          </Button>
          <ActionButton appearance="positive" disabled={!isValid} onClick={handleSave}>
            Save
          </ActionButton>
        </SidePanel.Footer>
      </SidePanel.Sticky>
    </SidePanel>
  );
};

export default AddChecksumPanel;
