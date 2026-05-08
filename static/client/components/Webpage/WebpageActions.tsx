import type { ReactNode } from "react";
import React, { useMemo, useState } from "react";

import { ActionButton, Button, Tooltip, useToastNotification } from "@canonical/react-components";
import { useQueryClient } from "react-query";

import RequestCopydocPanel from "@/components/RequestCopydocPanel/RequestCopydocPanel";
import RequestRemovalPanel from "@/components/RequestRemovalPanel";
import RequestTaskModal from "@/components/RequestTaskModal/RequestTaskModal";
import { canActOnPage } from "@/helpers/permissions";
import { parseError } from "@/helpers/requests";
import { JiraServices } from "@/services/api/services/jira";
import type { IJiraTask, IPage } from "@/services/api/types/pages";
import { ChangeRequestType, PageStatus } from "@/services/api/types/pages";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";

const WebpageActions = ({
  page,
  requiresContentReviewSubmission,
  contentReviewTask,
  isPendingContentReview,
}: {
  page: IPage;
  requiresContentReviewSubmission: boolean;
  contentReviewTask: IJiraTask | null;
  isPendingContentReview: boolean;
}): ReactNode => {
  const [modalOpen, setModalOpen] = useState(false);
  const [changeType, setChangeType] = useState<(typeof ChangeRequestType)[keyof typeof ChangeRequestType]>(
    ChangeRequestType.COPY_UPDATE,
  );
  const [loading, setLoading] = useState(false);
  const notify = useToastNotification();
  const queryClient = useQueryClient();

  const user = useStore((state) => state.user);

  const [copyUpdatePanelVisible, toggleCopyUpdatePanel, toggleRequestRemovalPanel] = usePanelsStore((state) => [
    state.copyUpdatePanelVisible,
    state.toggleCopyUpdatePanel,
    state.toggleRequestRemovalPanel,
  ]);

  const isNew = useMemo(() => page.status === PageStatus.NEW, [page]);

  const handleRequestChange = (type: (typeof ChangeRequestType)[keyof typeof ChangeRequestType]) => {
    setChangeType(type);
    switch (type) {
      case ChangeRequestType.COPY_UPDATE:
        toggleCopyUpdatePanel();
        break;
      case ChangeRequestType.PAGE_REFRESH:
      case ChangeRequestType.NEW_WEBPAGE:
        setModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const canAct = useMemo(() => canActOnPage(user, page), [user, page]);

  const isPageSetToDelete = useMemo(() => page.status === PageStatus.TO_DELETE, [page.status]);

  function submitForContentReview() {
    if (!contentReviewTask) return;
    setLoading(true);
    JiraServices.submitForContentReview(contentReviewTask.jira_id)
      .then(() => {
        void queryClient.invalidateQueries("pages");
        notify.success("The Content team will review your page", [], "Your new page request is in review");
      })
      .catch((error) => {
        const { message, description } = parseError(error);
        notify.failure(message, null, <p>{description}</p>);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  const toolTipMessage = useMemo(() => {
    if (isPageSetToDelete) return "This page is scheduled for removal";
    if (!canAct) {
      return "Only the page owner or contributors can perform actions";
    }
    return "";
  }, [isPageSetToDelete, canAct]);

  const allActionsDisabled = !canAct || isPageSetToDelete;

  return (
    <div className="l-webpage__actions p-segmented-control">
      <Tooltip message={toolTipMessage} zIndex={999}>
        <div aria-label="Juju technology" className="p-segmented-control__list" role="tablist">
          {!isNew && (
            <>
              <Button
                className="p-segmented-control__button"
                disabled={allActionsDisabled}
                hasIcon
                onClick={() => handleRequestChange(ChangeRequestType.COPY_UPDATE)}
              >
                <React.Fragment key=".0">
                  <i className="p-icon--file" /> <span>Copy update</span>
                </React.Fragment>
              </Button>
              <Button
                className="p-segmented-control__button"
                disabled={allActionsDisabled}
                hasIcon
                onClick={() => handleRequestChange(ChangeRequestType.PAGE_REFRESH)}
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

          {(requiresContentReviewSubmission || (page.status === PageStatus.NEW && isPendingContentReview)) && (
            <Tooltip
              message={
                isPendingContentReview ? (
                  <span>
                    The ticket is pending content review. <br />
                    You can follow our progress on Jira or in your requests.
                  </span>
                ) : (
                  ""
                )
              }
              position="btm-center"
              zIndex={999}
            >
              <ActionButton
                appearance="positive"
                className="p-segmented-control__button"
                disabled={isPendingContentReview}
                loading={loading}
                onClick={submitForContentReview}
              >
                <React.Fragment key=".0">
                  <i className="p-icon--file is-dark" /> <span>Submit for content review</span>
                </React.Fragment>
              </ActionButton>
            </Tooltip>
          )}
        </div>
      </Tooltip>

      {copyUpdatePanelVisible && <RequestCopydocPanel webpage={page} />}

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
