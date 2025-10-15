import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActionButton,
  Button,
  Icon,
  Input,
  Select,
  SidePanel,
  Textarea,
  useToastNotification,
} from "@canonical/react-components";

import config from "@/config";
import { JiraServices } from "@/services/api/services/jira";
import type { IReportBugResponse } from "@/services/api/types/jira";
import { useStore } from "@/store";

const ReportBugPanel = ({ buttonLabel = "Submit Report", project = "" }) => {
  const notify = useToastNotification();
  const [isOpen, setIsOpen] = useState(false);

  const [website, setWebsite] = useState(project || config.allProjects[0]);
  const [dueDate, setDueDate] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const togglePanel = () => setIsOpen((prev) => !prev);

  const submitButtonEnabled = useMemo(
    () => website && dueDate && summary.trim().length > 0 && description.trim().length > 0 && !loading,
    [description, dueDate, loading, summary, website],
  );

  useEffect(() => {
    if (project) {
      setWebsite(project);
    }
  }, [project]);

  const onSubmitError = useCallback(
    (error: any) => {
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
      due_date: dueDate,
      website,
      reporter_struct: user,
    })
      .then(({ data }: IReportBugResponse) => {
        togglePanel();
        notify.success(
          "A member of the sites team will pick up the issue. Please follow our progress on the Jira ticket.",
          [{ label: "View issue", onClick: () => window.open(`${config.jiraTaskLink}${data.issue?.key}`, "_blank") }],
          "You have successfully reported a bug",
        );
      })
      .catch(onSubmitError)
      .finally(() => setLoading(false));
  }, [description, dueDate, notify, onSubmitError, summary, user, website]);

  return (
    <>
      <Button onClick={togglePanel}>{buttonLabel}</Button>
      <SidePanel isOpen={isOpen} pinned>
        <SidePanel.Sticky>
          <div className="p-section--shallow">
            <SidePanel.Header>
              <SidePanel.HeaderTitle>Report a bug</SidePanel.HeaderTitle>
              <SidePanel.HeaderControls>
                <Button
                  appearance="base"
                  aria-label="Close"
                  className="u-no-margin--bottom"
                  hasIcon
                  onClick={togglePanel}
                >
                  <Icon name="close" />
                </Button>
              </SidePanel.HeaderControls>
            </SidePanel.Header>
          </div>
        </SidePanel.Sticky>
        <SidePanel.Content>
          <Input label="Brief summary of bug" onChange={(e) => setSummary(e.target.value)} required type="text" />
          <Textarea
            label="Bug description"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the bug in detail and the steps involved to recreate this problem"
            required
            rows={5}
          />
          <Select
            label="Website link"
            onChange={(e) => setWebsite(e.target.value)}
            options={config.allProjects.map((p) => {
              return { label: p, value: p };
            })}
            value={website}
          />
          <Input label="Due date" onChange={(e) => setDueDate(e.target.value)} required type="date" />
        </SidePanel.Content>
        <SidePanel.Sticky position="bottom">
          <SidePanel.Footer className="u-align--right">
            <Button>Cancel</Button>
            <ActionButton appearance="positive" disabled={!submitButtonEnabled} loading={loading} onClick={onSubmit}>
              Submit
            </ActionButton>
          </SidePanel.Footer>
        </SidePanel.Sticky>
      </SidePanel>
    </>
  );
};

export default ReportBugPanel;
