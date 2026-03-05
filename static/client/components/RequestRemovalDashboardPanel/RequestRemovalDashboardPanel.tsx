import { useCallback, useMemo, useState } from "react";

import { ActionButton, Button, Icon, SidePanel, Tooltip } from "@canonical/react-components";

import CustomSearchAndFilter from "@/components/Common/CustomSearchAndFilter";
import RemovalForm from "@/components/RemovalForm";
import { useProjects } from "@/services/api/hooks/projects";
import type { IPage } from "@/services/api/types/pages";
import { usePanelsStore } from "@/store/app";
import { flattenPages } from "@/utils/flattenPages";

type IPageOption = { id: number; name: string; title: string; page: IPage };

const RequestRemovalDashboardPanel = () => {
  const [panelVisible, togglePanel] = usePanelsStore((state) => [
    state.requestRemovalDashboardPanelVisible,
    state.toggleRequestRemovalDashboardPanel,
  ]);

  const { unfilteredProjects: projects } = useProjects();

  const [selectedPage, setSelectedPage] = useState<IPageOption | null>(null);
  const [formActions, setFormActions] = useState<{ onSubmit: () => void; loading: boolean } | null>(null);

  const allPages = useMemo(() => {
    if (!projects?.length) return [];
    return projects.flatMap((project) => {
      if (!project?.templates) return [];
      return flattenPages(project.templates);
    });
  }, [projects]);

  const pageOptions: IPageOption[] = useMemo(
    () =>
      allPages.map((page) => ({
        id: page.id as number,
        name: page.project?.name ? page.project.name + page.name : page.name,
        title: page.title || "",
        page,
      })),
    [allPages],
  );

  const handleSelectPage = useCallback((option: IPageOption) => {
    setSelectedPage(option);
  }, []);

  const handleRemovePage = useCallback(
    () => () => {
      setSelectedPage(null);
    },
    [],
  );

  const handleClose = useCallback(() => {
    togglePanel();
    setSelectedPage(null);
    setFormActions(null);
  }, [togglePanel]);

  const handleSuccess = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const renderPageOption = useCallback(
    (option: IPageOption) => (
      <span className="p-chip__value">
        <span>{option.name}</span>
        {option.title && <span className="u-text--muted p-text--small"> — {option.title}</span>}
      </span>
    ),
    [],
  );

  const isStep2 = selectedPage !== null;

  return (
    <>
      <Button onClick={togglePanel}>Request removal</Button>
      <SidePanel isOpen={panelVisible} overlay>
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
                onClick={handleClose}
              >
                <Icon name="close" />
              </Button>
            </SidePanel.HeaderControls>
          </SidePanel.Header>
        </SidePanel.Sticky>
        <SidePanel.Content>
          {isStep2 ? (
            <RemovalForm onActionsReady={setFormActions} onSuccess={handleSuccess} webpage={selectedPage.page} />
          ) : (
            <>
              <p>Choose the page you want to remove</p>
              <CustomSearchAndFilter<IPageOption>
                indexKey="id"
                label=""
                labelKey="name"
                onRemove={handleRemovePage}
                onSelect={handleSelectPage}
                options={pageOptions}
                placeholder="Search by page title or URL"
                renderOption={renderPageOption}
                searchKeys={["name", "title"]}
                selectedOptions={selectedPage ? [selectedPage] : []}
              />
            </>
          )}
        </SidePanel.Content>
        <SidePanel.Sticky position="bottom">
          <SidePanel.Footer className="u-align--right">
            <Button onClick={handleClose}>Cancel</Button>
            {isStep2 ? (
              <ActionButton
                appearance="positive"
                disabled={formActions?.loading}
                loading={formActions?.loading}
                onClick={formActions?.onSubmit}
              >
                Remove page
              </ActionButton>
            ) : (
              <Button appearance="positive" disabled={!selectedPage} onClick={() => {}}>
                Next
              </Button>
            )}
          </SidePanel.Footer>
        </SidePanel.Sticky>
      </SidePanel>
    </>
  );
};

export default RequestRemovalDashboardPanel;
