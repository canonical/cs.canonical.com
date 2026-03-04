import { useCallback, useMemo, useState } from "react";

import {
  ActionButton,
  Button,
  Icon,
  Input,
  SidePanel,
  Textarea,
  Tooltip,
  useToastNotification,
} from "@canonical/react-components";
import type { AxiosError } from "axios";

import config from "@/config";
import type { IBasicApiError } from "@/services/api/partials/BasicApiClass";
import { JiraServices } from "@/services/api/services/jira";
import type { IRequestFeatureResponse } from "@/services/api/types/jira";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";

const RequestFeaturePanel = () => {
  const notify = useToastNotification();
  const [requestFeaturePanelVisible, toggleRequestFeaturePanel] = usePanelsStore((state) => [
    state.requestFeaturePanelVisible,
    state.toggleRequestFeaturePanel,
  ]);
  const [dueDate, setDueDate] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [objective, setObjective] = useState<string>("");
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const submitButtonEnabled = useMemo(
    () =>
      dueDate && summary.trim().length > 0 && description.trim().length > 0 && objective.trim().length > 0 && !loading,
    [description, dueDate, loading, objective, summary],
  );

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
    JiraServices.requestFeature({
      summary,
      description,
      due_date: dueDate,
      objective,
      reporter_struct: user,
    })
      .then(({ data }: IRequestFeatureResponse) => {
        toggleRequestFeaturePanel();
        notify.success(
          "The Sites Team will review your request. You can follow our progress on Jira or in your requests.",
          [{ label: "View on Jira", onClick: () => window.open(`${config.jiraTaskLink}${data.issue?.key}`, "_blank") }],
          "You submitted a feature request",
        );
      })
      .catch(onSubmitError)
      .finally(() => setLoading(false));
  }, [description, dueDate, notify, objective, onSubmitError, summary, toggleRequestFeaturePanel, user]);

  return (
    <>
      <Button onClick={toggleRequestFeaturePanel}>Request feature</Button>
      <SidePanel isOpen={requestFeaturePanelVisible}>
        <SidePanel.Sticky>
          <SidePanel.Header>
            <SidePanel.HeaderTitle>
              Request feature{" "}
              <Tooltip
                message="Request features such as adding redirects, or adding side cards"
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
                onClick={toggleRequestFeaturePanel}
              >
                <Icon name="close" />
              </Button>
            </SidePanel.HeaderControls>
          </SidePanel.Header>
        </SidePanel.Sticky>
        <SidePanel.Content>
          <p>
            <strong>Add information about your feature and submit</strong>
          </p>
          <Input label="1. Name the feature" onChange={(e) => setSummary(e.target.value)} type="text" value={summary} />
          <Textarea
            label="2. Add a detailed description"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details and context, such as the stakeholders and intended users"
            rows={5}
            value={description}
          />
          <Textarea
            label="3. Explain your objective"
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Add supporting information, such as the added value from this feature"
            rows={5}
            value={objective}
          />
          <Input
            label="4. Request a preferred delivery date"
            onChange={(e) => setDueDate(e.target.value)}
            type="date"
            value={dueDate}
          />
          <p className="u-text--muted p-text--small">
            The sites team will review your request. If accepted, we will estimate a due date. Otherwise we will provide
            a reason for rejecting in the Jira comments.
          </p>
        </SidePanel.Content>
        <SidePanel.Sticky>
          <SidePanel.Footer className="u-align--right">
            <Button onClick={toggleRequestFeaturePanel}>Cancel</Button>
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
