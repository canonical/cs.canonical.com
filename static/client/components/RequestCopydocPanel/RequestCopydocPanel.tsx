import { type ChangeEvent, type FormEvent, useCallback, useMemo, useState, type ReactNode } from "react";
import React from "react";

import {
  ActionButton,
  Button,
  Icon,
  SidePanel,
  Textarea,
  Notification,
  useToastNotification,
} from "@canonical/react-components";
import type { AxiosError } from "axios";

import { useNavigate } from 'react-router-dom'
import config from "@/config";

import type { IRequestCopydocPanel } from "./RequestCopydocPanel.types";
import { usePages } from "@/services/api/hooks/pages";
import type { IBasicApiError } from "@/services/api/partials/BasicApiClass";
import { PagesServices } from "@/services/api/services/pages";
import { ChangeRequestType, PageStatus } from "@/services/api/types/pages";
import { useStore } from "@/store";

const getBusinessDate = (daysToAdd: number) => {
  const date = new Date();
  let addedDays = 0;
  while (addedDays < daysToAdd) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      addedDays++;
    }
  }
  return date;
};

const RequestCopydocPanel = ({ changeType, isOpen, onClose, webpage }: IRequestCopydocPanel): ReactNode => {
  const [descr, setDescr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const user = useStore((state) => state.user);
  const { refetch } = usePages(true);
  const [selectedProject, setSelectedProject] = useStore((state) => [state.selectedProject, state.setSelectedProject]);
  const notify = useToastNotification();
  const navigate = useNavigate();

  const dueDateObj = useMemo(() => getBusinessDate(3), []);
  const formattedDueDate = useMemo(() => dueDateObj.toLocaleDateString("en-GB"), [dueDateObj]);

  const handleDescrChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescr(e.target.value);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    setDescr("");
  }, [onClose]);

  const viewTicket = useCallback((ticketId: string) => {
    window.open(`${config.jiraTaskLink}${ticketId}`, "_blank");
  }, [])

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
  // );

  const onSubmitError = useCallback(
    (error: AxiosError<IBasicApiError>) => {
      if (error?.response?.data) {
        notify.failure(error.response.data?.error, null, <p>{error.response.data?.description}</p>);
      }
    },
    [notify],
  );

  const onSubmitFinally = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!webpage?.id) return;
    setIsLoading(true);

    PagesServices.requestChanges({
      due_date: dueDateObj.toISOString().split("T")[0],
      webpage_id: webpage.id,
      reporter_struct: user,
      type: changeType,
      summary: "Copy update request",
      description: `Copy doc link: ${webpage.copy_doc_link} \n${descr}`,
      request_type: Object.keys(ChangeRequestType).find(
        (key) => ChangeRequestType[key as keyof typeof ChangeRequestType] === changeType,
      ) as string,
    })
      .then((response) => {
          notify.success(
          "Your update will be applied within 3 business days. You can follow our progress on Jira  or in your requests.",
          [
            {
              label: "View on Jira",
              onClick: () => viewTicket(response.data.jira_task_id),
            },
            {
              label: "View your requests",
              onClick: () => navigate("/app"),
            }
          ],
          "You submitted a copy update",
        );
        handleSuccess()
      })
      .catch(onSubmitError)
      .finally(onSubmitFinally);
  }, [
    webpage?.id,
    webpage?.copy_doc_link,
    changeType,
    dueDateObj,
    user,
    descr,
    onSubmitError,
    onSubmitFinally,
    handleSuccess,
  ]);

  return (
    <SidePanel className="request-copydoc-panel" isOpen={isOpen} overlay>
      <SidePanel.Sticky>
        <SidePanel.Header>
          <SidePanel.HeaderTitle className="u-no-padding--top">
            Request a copy update
          </SidePanel.HeaderTitle>
          <SidePanel.HeaderControls className="u-no-padding--top">
            <Button appearance="base" aria-label="Close" className="u-no-margin--bottom" hasIcon onClick={handleClose}>
              <Icon name="close" />
            </Button>
          </SidePanel.HeaderControls>
        </SidePanel.Header>
      </SidePanel.Sticky>

      <SidePanel.Content>
        <form id="copydoc-update-form" onSubmit={handleSubmit}>
          <p>
            <strong>Update your copy doc and submit</strong>
          </p>
          <div className="u-sv1">
            <p className="u-sv-1">
              1. Open the <a href={webpage.copy_doc_link} target="_blank" rel="noreferrer">copy doc of your page <Icon name="external-link"/></a>
            </p>
            <p className="u-sv-2">
              2. Edit your copy doc in 'Suggested' mode
            </p>
            <Textarea
              label="3. Add a description (optional)"
              onChange={handleDescrChange}
              placeholder="Additional details or context"
              rows={7}
            />
          </div>
          <p>
            Assigned due date: {formattedDueDate}
          </p>
          <p class="u-text--muted p-text--small u-sv-2">Copy updates are applied within 3 business days of your request</p>
        </form>
      </SidePanel.Content>

      <SidePanel.Sticky>
        <SidePanel.Footer className="u-align--right">
          <Button onClick={handleClose}>Cancel</Button>
          <ActionButton
            appearance="positive"
            disabled={isLoading}
            form="copydoc-update-form"
            loading={isLoading}
            type="submit"
          >
            Submit
          </ActionButton>
        </SidePanel.Footer>
      </SidePanel.Sticky>
    </SidePanel>
  );
};

export default RequestCopydocPanel;