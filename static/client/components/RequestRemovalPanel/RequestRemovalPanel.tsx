import { useCallback, useState } from "react";

import { ActionButton, Button, Icon, SidePanel, Tooltip } from "@canonical/react-components";
import { useNavigate } from "react-router-dom";

import type { IRequestRemovalPanelProps } from "./RequestRemovalPanel.types";

import RemovalForm from "@/components/RemovalForm/RemovalForm";
import PageSearch from "@/components/Search";
import { type IPageOption, usePageOptions } from "@/helpers/usePageOptions";
import { usePages } from "@/services/api/hooks/pages";
import { PageStatus } from "@/services/api/types/pages";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";

const RequestRemovalPanel = ({ webpage }: IRequestRemovalPanelProps) => {
  const navigate = useNavigate();
  const [panelVisible, togglePanel] = usePanelsStore((state) => [
    state.requestRemovalPanelVisible,
    state.toggleRequestRemovalPanel,
  ]);

  const selectedProject = useStore((state) => state.selectedProject);
  const setSelectedProject = useStore((state) => state.setSelectedProject);

  const { refetch } = usePages(true);

  const pageOptions = usePageOptions();

  const [selectedPage, setSelectedPage] = useState<IPageOption | null>(null);
  const [confirmedPage, setConfirmedPage] = useState<IPageOption | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = useCallback(() => {
    togglePanel();
    setSelectedPage(null);
    setConfirmedPage(null);
    setLoading(false);
  }, [togglePanel]);

  const handleSuccess = useCallback(async () => {
    handleClose();

    if (webpage) {
      if (refetch) {
        try {
          const data = await refetch();
          if (data?.length) {
            const project = data.find((p) => {
              return p.data?.name === selectedProject?.name;
            });
            if (project && project.data) {
              setSelectedProject(project.data);
            }
          }
        } catch {
          // silently handle refetch failure
        }
      }

      if (webpage && webpage.status === PageStatus.NEW) {
        navigate("/app", { replace: true });
      }
    }
  }, [handleClose, navigate, refetch, selectedProject?.name, setSelectedProject, webpage]);

  const activeWebpage = webpage ?? confirmedPage?.page;
  const showForm = activeWebpage !== undefined;

  return (
    <SidePanel className="request-removal-panel" isOpen={panelVisible} overlay>
      <SidePanel.Sticky>
        <SidePanel.Header>
          <SidePanel.HeaderTitle className="u-no-padding--top">
            Remove page{" "}
            <Tooltip
              message="Archive and set up redirects for a page on our website."
              position="btm-center"
              zIndex={999}
            >
              <Icon name="information" size={16} />
            </Tooltip>
          </SidePanel.HeaderTitle>
          <SidePanel.HeaderControls className="u-no-padding--top">
            <Button appearance="base" aria-label="Close" className="u-no-margin--bottom" hasIcon onClick={handleClose}>
              <Icon name="close" />
            </Button>
          </SidePanel.HeaderControls>
        </SidePanel.Header>
      </SidePanel.Sticky>
      <SidePanel.Content>
        {showForm ? (
          <RemovalForm onLoadingChange={setLoading} onSuccess={handleSuccess} webpage={activeWebpage} />
        ) : (
          <>
            <p className="p-heading--5 u-no-margin--bottom u-sv1">Choose the page you want to remove</p>
            <PageSearch<IPageOption>
              onClear={() => setSelectedPage(null)}
              onSelect={setSelectedPage}
              options={pageOptions}
              placeholder="Search by page title or URL"
              value={selectedPage}
            />
          </>
        )}
      </SidePanel.Content>
      <SidePanel.Sticky>
        <SidePanel.Footer className="u-align--right">
          <Button onClick={handleClose}>Cancel</Button>
          {showForm ? (
            <ActionButton appearance="positive" disabled={loading} form="removal-form" loading={loading} type="submit">
              Remove page
            </ActionButton>
          ) : (
            <Button appearance="positive" disabled={!selectedPage} onClick={() => setConfirmedPage(selectedPage)}>
              Next
            </Button>
          )}
        </SidePanel.Footer>
      </SidePanel.Sticky>
    </SidePanel>
  );
};

export default RequestRemovalPanel;
