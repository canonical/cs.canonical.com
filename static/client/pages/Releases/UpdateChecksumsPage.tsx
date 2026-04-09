import { type ReactNode, useState } from "react";

import { Button } from "@canonical/react-components";
import { useOutletContext } from "react-router-dom";

import type { IReleasesLayoutOutletContext } from "./ReleasesLayout";
import AddChecksumPanel, { type IChecksumEditTarget } from "./components/AddChecksumPanel";
import ChecksumCategoryTable from "./components/ChecksumCategoryTable";

import { isRecord } from "@/services/api/types/releases";
import { usePanelsStore } from "@/store/app";

const UpdateChecksumsPage = (): ReactNode => {
  const { formData, handleChecksumAdd, handleChecksumDelete } = useOutletContext<IReleasesLayoutOutletContext>();

  const [addChecksumPanelVisible, toggleAddChecksumPanel] = usePanelsStore((state) => [
    state.addChecksumPanelVisible,
    state.toggleAddChecksumPanel,
  ]);

  const [editTarget, setEditTarget] = useState<IChecksumEditTarget | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const checksums = isRecord(formData.checksums) ? (formData.checksums as Record<string, Record<string, string>>) : {};
  const categories = Object.keys(checksums);

  const handleToggleCategory = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  const handleOpenAdd = () => {
    setEditTarget(null);
    if (!addChecksumPanelVisible) toggleAddChecksumPanel();
  };

  const handleOpenEdit = (category: string, version: string, hash: string) => {
    setEditTarget({ category, version, hash });
    if (!addChecksumPanelVisible) toggleAddChecksumPanel();
  };

  const handleSave = (category: string, version: string, hash: string) => {
    // If editing and key changed, remove old entry first
    if (editTarget && (editTarget.category !== category || editTarget.version !== version)) {
      handleChecksumDelete(editTarget.category, editTarget.version);
    }
    handleChecksumAdd(category, version, hash);
    // Expand the target category to give feedback that the row was saved
    setExpandedCategory(category);
    if (addChecksumPanelVisible) toggleAddChecksumPanel();
    setEditTarget(null);
  };

  const handleCancel = () => {
    if (addChecksumPanelVisible) toggleAddChecksumPanel();
    setEditTarget(null);
  };

  return (
    <div className="l-update-checksums">
      <div className="l-update-checksums__toolbar">
        <Button hasIcon onClick={handleOpenAdd}>
          <i className="p-icon--plus" /> <span>Add checksum</span>
        </Button>
      </div>
      {categories.length > 0 ? (
        <aside className="p-accordion">
          <ul className="p-accordion__list">
            {categories.map((category) => (
              <ChecksumCategoryTable
                key={category}
                category={category}
                isExpanded={expandedCategory === category}
                onDelete={(version) => handleChecksumDelete(category, version)}
                onEdit={(version, hash) => handleOpenEdit(category, version, hash)}
                onToggle={() => handleToggleCategory(category)}
                versions={checksums[category] ?? {}}
              />
            ))}
          </ul>
        </aside>
      ) : (
        <p className="u-text--muted">No checksum data available. Add a checksum to get started.</p>
      )}
      <AddChecksumPanel
        categories={categories}
        editTarget={editTarget}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </div>
  );
};

export default UpdateChecksumsPage;
