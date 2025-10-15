import { useCallback, useMemo, useState } from "react";

import { ActionButton, Button, Icon, Input, SidePanel, Textarea, useNotify } from "@canonical/react-components";

import config from "@/config";
import { JiraServices } from "@/services/api/services/jira";
import type { IRequestFeatureResponse } from "@/services/api/types/jira";
import { useStore } from "@/store";

const RequestFeaturePanel = () => {
  const notify = useNotify();
  const [isOpen, setIsOpen] = useState(false);

  const [dueDate, setDueDate] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [objective, setObjective] = useState<string>("");
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const togglePanel = () => setIsOpen((prev) => !prev);

  const submitButtonEnabled = useMemo(
    () =>
      dueDate && summary.trim().length > 0 && description.trim().length > 0 && objective.trim().length > 0 && !loading,
    [description, dueDate, loading, objective, summary],
  );

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
    JiraServices.requestFeature({
      summary,
      description,
      due_date: dueDate,
      objective,
      reporter_struct: user,
    })
      .then(({ data }: IRequestFeatureResponse) => {
        togglePanel();
        notify.success(
          <div>
            <p>A member of the sites team will pick up the issue. Please follow our progress on the Jira ticket.</p>
            <hr className="p-rule" />
            <div className="u-align--right">
              <a href={`${config.jiraTaskLink}${data.issue?.key}`} rel="noreferrer" target="_blank">
                View issue
              </a>
            </div>
          </div>,
          "You have successfully submitted a feature request",
        );
      })
      .catch(onSubmitError)
      .finally(() => setLoading(false));
  }, [description, dueDate, notify, objective, onSubmitError, summary, user]);

  return (
    <>
      <Button onClick={togglePanel}>Request feature</Button>
      <SidePanel isOpen={isOpen} pinned>
        <SidePanel.Sticky>
          <div className="p-section--shallow">
            <SidePanel.Header>
              <SidePanel.HeaderTitle>Request a feature</SidePanel.HeaderTitle>
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
          <Input label="Summary" onChange={(e) => setSummary(e.target.value)} required type="text" />
          <Textarea
            label="Description"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide a detailed description of your request"
            required
            rows={5}
          />
          <Textarea
            label="Objective"
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Briefly explain the value of this request. Higher-impact items will be prioritized."
            required
            rows={5}
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

export default RequestFeaturePanel;
