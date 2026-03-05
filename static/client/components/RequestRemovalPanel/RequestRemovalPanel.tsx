import { useCallback, useState } from "react";

import { ActionButton, Button, Icon, SidePanel, Tooltip } from "@canonical/react-components";
import { useNavigate } from "react-router-dom";

import type { IRequestRemovalPanelProps } from "./RequestRemovalPanel.types";

import RemovalForm from "@/components/RemovalForm/RemovalForm";
import { usePages } from "@/services/api/hooks/pages";
import { PageStatus } from "@/services/api/types/pages";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";

const RequestRemovalPanel = ({ webpage }: IRequestRemovalPanelProps) => {
  const navigate = useNavigate();
  const requestRemovalPanelVisible = usePanelsStore((state) => state.requestRemovalPanelVisible);
  const toggleRequestRemovalPanel = usePanelsStore((state) => state.toggleRequestRemovalPanel);

  const selectedProject = useStore((state) => state.selectedProject);
  const setSelectedProject = useStore((state) => state.setSelectedProject);

  const { refetch } = usePages(true);

  const [formActions, setFormActions] = useState<{ onSubmit: () => void; loading: boolean } | null>(null);

  const handleSuccess = useCallback(() => {
    toggleRequestRemovalPanel();

    const afterRefetch = () => {
      if (webpage.status === PageStatus.NEW) {
        navigate("/app", { replace: true });
      } else {
        window.location.reload();
      }
    };

    if (refetch) {
      refetch().then((data) => {
        if (data?.length) {
          const project = data.find((p) => p.data?.name === selectedProject?.name);
          if (project && project.data) {
            setSelectedProject(project.data);
          }
        }
        afterRefetch();
      });
    } else {
      afterRefetch();
    }
  }, [navigate, refetch, selectedProject?.name, setSelectedProject, toggleRequestRemovalPanel, webpage.status]);

  return (
    <SidePanel isOpen={requestRemovalPanelVisible} overlay>
      <SidePanel.Sticky>
        <SidePanel.Header>
          <SidePanel.HeaderTitle>
            Remove page{" "}
            <Tooltip
              message="Archive and set up redirects for a page on our website."
              position="btm-center"
              zIndex={999}
            >
              <Icon name="information" />
            </Tooltip>
          </SidePanel.HeaderTitle>
          <SidePanel.HeaderControls>
            <Button
              appearance="base"
              aria-label="Close"
              className="u-no-margin--bottom"
              hasIcon
              onClick={toggleRequestRemovalPanel}
            >
              <Icon name="close" />
            </Button>
          </SidePanel.HeaderControls>
        </SidePanel.Header>
      </SidePanel.Sticky>
      <SidePanel.Content>
        <RemovalForm onActionsReady={setFormActions} onSuccess={handleSuccess} webpage={webpage} />
      </SidePanel.Content>
      <SidePanel.Sticky position="bottom">
        <SidePanel.Footer className="u-align--right">
          <Button onClick={toggleRequestRemovalPanel}>Cancel</Button>
          <ActionButton
            appearance="negative"
            disabled={formActions?.loading}
            loading={formActions?.loading}
            onClick={formActions?.onSubmit}
          >
            Remove page
          </ActionButton>
        </SidePanel.Footer>
      </SidePanel.Sticky>
    </SidePanel>
  );
};

export default RequestRemovalPanel;
