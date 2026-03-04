import React, { useCallback, useMemo, useState } from "react";

import {
  ActionButton,
  Button,
  Icon,
  Input,
  Modal,
  SidePanel,
  Textarea,
  Tooltip,
  useToastNotification,
} from "@canonical/react-components";
import type { AxiosError } from "axios";

import config from "@/config";
import type { IBasicApiError } from "@/services/api/partials/BasicApiClass";
import { JiraServices } from "@/services/api/services/jira";
import type { IReportBugResponse } from "@/services/api/types/jira";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";
import "./_ReportBugPanel.scss";

function viewTicket(ticketId: string) {
  window.open(`${config.jiraTaskLink}${ticketId}`, "_blank");
}

const ReportBugPanel = ({ buttonLabel = "Submit Report", project = "" }) => {
  const notify = useToastNotification();
  const [reportBugPanelVisible, toggleReportBugPanel] = usePanelsStore((state) => [
    state.reportBugPanelVisible,
    state.toggleReportBugPanel,
  ]);
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const submitButtonEnabled = useMemo(
    () => url && summary.trim().length > 0 && description.trim().length > 0 && !loading,
    [description, loading, summary, url],
  );

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [ticketId, setTicketId] = useState("");

  const onSubmitError = useCallback(
    (error: AxiosError<IBasicApiError>) => {
      if (error?.response?.data) {
        notify.failure(error.response.data?.error, null, <p>{error.response.data?.description}</p>);
      }
    },
    [notify],
  );

  const onSubmit = useCallback(() => {
    setLoading(true);
    JiraServices.reportBug({
      summary,
      description,
      url,
      reporter_struct: user,
      due_date: "",
    })
      .then(({ data }: IReportBugResponse) => {
        toggleReportBugPanel();
        setSuccessModalOpen(true);
        notify.success(
          "Please add attachments, such as schreenshots of the bug, to the Jira ticket.",
          [{ label: "View on Jira", onClick: () => viewTicket(data.issue?.key) }],
          "You submitted a bug report",
        );
        setTicketId(data.issue?.key || "");
      })
      .catch(onSubmitError)
      .finally(() => setLoading(false));
  }, [description, notify, onSubmitError, summary, toggleReportBugPanel, user, url]);

  return (
    <>
      <Button onClick={toggleReportBugPanel}>{buttonLabel}</Button>
      <SidePanel isOpen={reportBugPanelVisible}>
        <SidePanel.Sticky>
          <SidePanel.Header>
            <SidePanel.HeaderTitle>
              Report bug{" "}
              <Tooltip message="Report a bug found on one of our websites" position="btm-center" zIndex={999}>
                <Icon name="information" />
              </Tooltip>
            </SidePanel.HeaderTitle>
            <SidePanel.HeaderControls>
              <Button
                appearance="base"
                aria-label="Close"
                className="u-no-margin--bottom"
                hasIcon
                onClick={toggleReportBugPanel}
              >
                <Icon name="close" />
              </Button>
            </SidePanel.HeaderControls>
          </SidePanel.Header>
        </SidePanel.Sticky>
        <SidePanel.Content>
          <Input
            aria-required
            className="u-sv1"
            label="1. Summarize the bug"
            onChange={(e) => setSummary(e.target.value)}
            type="text"
            value={summary}
          />
          <Textarea
            aria-required
            className="u-sv1"
            label="2. Add a detailed description"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, including steps to recreate the bug"
            rows={5}
            value={description}
          />
          <Input
            aria-required
            className="u-sv1"
            label="3. Paste the page URL"
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            value={url}
          />
        </SidePanel.Content>
        <SidePanel.Sticky>
          <SidePanel.Footer className="u-align--right">
            <Button onClick={toggleReportBugPanel}>Cancel</Button>
            <ActionButton appearance="positive" disabled={!submitButtonEnabled} loading={loading} onClick={onSubmit}>
              Submit
            </ActionButton>
          </SidePanel.Footer>
        </SidePanel.Sticky>
      </SidePanel>

      {successModalOpen && (
        <Modal
          buttonRow={
            <>
              <Button appearance="positive" hasIcon onClick={() => viewTicket(ticketId)}>
                <React.Fragment key=".0">
                  <span>View on Jira</span>
                  <i className="p-icon--external-link is-dark" />
                </React.Fragment>
              </Button>
            </>
          }
          className={"p-bug-report-modal"}
          close={() => setSuccessModalOpen(false)}
          closeOnOutsideClick={false}
          title="Add attachments on Jira"
        >
          <p>Please add relevant attachments, including screenshots, to the Jira ticket.</p>
        </Modal>
      )}
    </>
  );
};

export default ReportBugPanel;
