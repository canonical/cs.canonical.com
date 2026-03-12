import type { ReactNode } from "react";
import React, { useCallback, useMemo, useState } from "react";

import { Button, Tooltip } from "@canonical/react-components";

import RequestRemovalPanel from "@/components/RequestRemovalPanel";
import RequestTaskModal from "@/components/RequestTaskModal/RequestTaskModal";
import type { IPage } from "@/services/api/types/pages";
import { ChangeRequestType, PageStatus } from "@/services/api/types/pages";
import { usePanelsStore } from "@/store/app";

const WebpageActions = ({ page }: { page: IPage }): ReactNode => {
  const [modalOpen, setModalOpen] = useState(false);
  const [changeType, setChangeType] = useState<(typeof ChangeRequestType)[keyof typeof ChangeRequestType]>(
    ChangeRequestType.COPY_UPDATE,
  );

  const toggleRequestRemovalPanel = usePanelsStore((state) => state.toggleRequestRemovalPanel);

  const isNew = useMemo(() => page.status === PageStatus.NEW, [page]);

  const hasJiraTasks = useMemo(() => page.jira_tasks?.length, [page]);

  // A page which was created from the content team's board on Jira
  // must have a valid content_jira_id
  const isContentBoardPage = useMemo(() => page.content_jira_id, [page]);

  const requestChanges = useCallback(() => {
    setChangeType(ChangeRequestType.COPY_UPDATE);
    setModalOpen(true);
  }, []);

  const createNewPage = useCallback(() => {
    setChangeType(ChangeRequestType.NEW_WEBPAGE);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const allActionsDisabled = useMemo(() => page.status === PageStatus.TO_DELETE, [page.status]);

  return (
    <div className="l-webpage__actions p-segmented-control">
      <Tooltip message={allActionsDisabled && "This page is scheduled for removal"} zIndex={999}>
        <div aria-label="Juju technology" className="p-segmented-control__list" role="tablist">
          {!isNew && (
            <>
              <Button
                className="p-segmented-control__button"
                disabled={allActionsDisabled}
                hasIcon
                onClick={requestChanges}
              >
                <React.Fragment key=".0">
                  <i className="p-icon--file" /> <span>Copy update</span>
                </React.Fragment>
              </Button>
              <Button
                className="p-segmented-control__button"
                disabled={allActionsDisabled}
                hasIcon
                onClick={requestChanges}
              >
                <React.Fragment key=".0">
                  <i className="p-icon--change-version" /> <span>Page refresh</span>
                </React.Fragment>
              </Button>
              <Button
                className="p-segmented-control__button"
                disabled={allActionsDisabled}
                hasIcon
                onClick={toggleRequestRemovalPanel}
              >
                <React.Fragment key=".0">
                  <i className="p-icon--delete" /> <span>Remove page</span>
                </React.Fragment>
              </Button>
            </>
          )}

          {isNew && !hasJiraTasks && !isContentBoardPage && (
            <Button appearance="positive" className="p-segmented-control__button" hasIcon onClick={createNewPage}>
              <React.Fragment key=".0">
                <i className="p-icon--file is-dark" /> <span>Submit for content review</span>
              </React.Fragment>
            </Button>
          )}
        </div>
      </Tooltip>

      {modalOpen && (
        <RequestTaskModal
          changeType={changeType}
          onClose={handleModalClose}
          onTypeChange={setChangeType}
          webpage={page}
        />
      )}
      <RequestRemovalPanel webpage={page} />
    </div>
  );
};

export default WebpageActions;
