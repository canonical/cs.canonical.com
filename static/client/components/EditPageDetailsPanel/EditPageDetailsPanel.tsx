import { useCallback, useEffect, useMemo, useState } from "react";

import { ActionButton, Button, Icon, Input, SidePanel } from "@canonical/react-components";

import ComboSelect from "@/components/Common/ComboSelect";
import MultiSelectPicker from "@/components/Common/MultiSelectPicker";
import config from "@/config";
import { useUsers } from "@/services/api/hooks/users";
import { PagesServices } from "@/services/api/services/pages";
import type { IPage } from "@/services/api/types/pages";
import type { IUser } from "@/services/api/types/users";
import { usePanelsStore } from "@/store/app";

interface EditPageDetailsPanelProps {
  page: IPage;
  project: string;
  onSave: (updates: Partial<IPage>) => void;
}

const EditPageDetailsPanel = ({ page, project, onSave }: EditPageDetailsPanelProps) => {
  const [panelVisible, togglePanel] = usePanelsStore((state) => [
    state.editPageDetailsPanelVisible,
    state.toggleEditPageDetailsPanel,
  ]);

  const { data: users } = useUsers();

  const [owner, setOwner] = useState<IUser | null>(null);
  const [reviewers, setReviewers] = useState<IUser[]>([]);
  const [copyDocLink, setCopyDocLink] = useState("");
  const [figmaLink, setFigmaLink] = useState("");
  const [loading, setLoading] = useState(false);

  const githubUrl = useMemo(() => {
    const ext = page.ext || ".html";
    if (page.children?.length) {
      return `${config.ghLink(project)}${page.name}/index${ext}`;
    }
    return `${config.ghLink(project)}${page.name}${ext}`;
  }, [page.children?.length, page.name, page.ext, project]);

  useEffect(() => {
    if (panelVisible) {
      setOwner(page.owner ?? null);
      setReviewers(page.reviewers ?? []);
      setCopyDocLink(page.copy_doc_link ?? "");
      setFigmaLink(page.figma_link ?? "");
    }
  }, [panelVisible, page]);

  const handleClose = useCallback(() => {
    togglePanel();
    setLoading(false);
  }, [togglePanel]);

  const handleSave = useCallback(() => {
    if (!page.id) return;

    setLoading(true);

    const updates: Partial<IPage> = {};
    if (owner) updates.owner = owner;
    if (reviewers) updates.reviewers = reviewers;
    updates.copy_doc_link = copyDocLink;
    updates.figma_link = figmaLink;

    onSave(updates);
    handleClose();

    // TODO: This is a temporary fix to handle the potential inconsistency in the job title field (jobTitle vs job_title) when updating page details. This should be removed once the API is consistent.
    // @ts-expect-error type inconsistency in API - jobTitle vs job_title
    if (owner) owner.jobTitle = owner.jobTitle || owner.job_title; // Handle potential inconsistency in job title field
    if (reviewers) {
      reviewers.forEach((reviewer) => {
        // @ts-expect-error type inconsistency in API - jobTitle vs job_title
        reviewer.jobTitle = reviewer.jobTitle || reviewer.job_title; // Handle potential inconsistency in job title field
      });
    }

    PagesServices.updatePageDetails({
      webpage_id: page.id,
      owner: owner ?? undefined,
      reviewers,
      copy_doc_link: copyDocLink,
      figma_link: figmaLink,
    }).catch(() => {
      // Revert will happen on next page load
    });
  }, [page.id, owner, reviewers, copyDocLink, figmaLink, onSave, handleClose]);

  return (
    <SidePanel isOpen={panelVisible} overlay>
      <SidePanel.Sticky>
        <SidePanel.Header>
          <SidePanel.HeaderTitle className="u-no-padding--top">Edit page details</SidePanel.HeaderTitle>
          <SidePanel.HeaderControls className="u-no-padding--top">
            <Button appearance="base" aria-label="Close" className="u-no-margin--bottom" hasIcon onClick={handleClose}>
              <Icon name="close" />
            </Button>
          </SidePanel.HeaderControls>
        </SidePanel.Header>
      </SidePanel.Sticky>
      <SidePanel.Content>
        <div className="u-sv2">
          <label className="p-form__label" htmlFor="owner-select">
            Owner
          </label>
          <ComboSelect<IUser>
            indexKey="id"
            labelKey="name"
            multiple={false}
            onClear={() => setOwner(null)}
            onSelect={(selected) => setOwner(selected as IUser)}
            options={users ?? []}
            placeholder="Search for an owner..."
            searchKeys={["name", "email"]}
            value={owner}
          />
        </div>

        <div className="u-sv2">
          <label className="p-form__label" htmlFor="contributors-select">
            Contributor(s)
          </label>
          <MultiSelectPicker<IUser>
            indexKey="id"
            labelKey="name"
            onSelect={(selected) => setReviewers(selected as IUser[])}
            options={users ?? []}
            placeholder="Search for contributors..."
            searchKeys={["name", "email"]}
            value={reviewers}
          />
        </div>

        <div className="u-sv2">
          <Input
            label="Copy doc URL"
            onChange={(e) => setCopyDocLink(e.target.value)}
            type="text"
            value={copyDocLink}
          />
        </div>

        <div className="u-sv2">
          <Input label="GitHub URL" readOnly type="text" value={githubUrl} />
        </div>

        <div className="u-sv2">
          <Input label="Figma URL" onChange={(e) => setFigmaLink(e.target.value)} type="text" value={figmaLink} />
        </div>
      </SidePanel.Content>
      <SidePanel.Sticky>
        <SidePanel.Footer className="u-align--right">
          <Button onClick={handleClose}>Cancel</Button>
          <ActionButton appearance="positive" loading={loading} onClick={handleSave}>
            Save changes
          </ActionButton>
        </SidePanel.Footer>
      </SidePanel.Sticky>
    </SidePanel>
  );
};

export default EditPageDetailsPanel;
