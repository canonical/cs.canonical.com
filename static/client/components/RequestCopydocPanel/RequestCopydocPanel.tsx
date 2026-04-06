import { type ChangeEvent, type FormEvent, useCallback, useMemo, useState, type ReactNode } from "react";
import React from "react";

import {
  ActionButton,
  Button,
  Icon,
  SidePanel,
  Textarea,
  useToastNotification,
  Tooltip,
} from "@canonical/react-components";
import type { AxiosError } from "axios";

import type { IRequestCopydocPanel } from "./RequestCopydocPanel.types";

import PageSearch from "@/components/Search";
import config from "@/config";
import { parseError } from "@/helpers/requests";
import { type IPageOption, usePageOptions } from "@/helpers/usePageOptions";
import { usePages } from "@/services/api/hooks/pages";
import type { IBasicApiError } from "@/services/api/partials/BasicApiClass";
import { PagesServices } from "@/services/api/services/pages";
import { ChangeRequestType } from "@/services/api/types/pages";
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

const COPYDOC_URL_REGEX = /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+/;

const RequestCopydocPanel = ({ isOpen, onClose, webpage }: IRequestCopydocPanel): ReactNode => {
  const [descr, setDescr] = useState("");
  const [newCopydocLink, setNewCopydocLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedPage, setSelectedPage] = useState<IPageOption | null>(null);
  const [confirmedPage, setConfirmedPage] = useState<IPageOption | null>(null);
  const pageOptions = usePageOptions();

  const user = useStore((state) => state.user);
  const { refetch } = usePages(true);
  const [selectedProject, setSelectedProject] = useStore((state) => [state.selectedProject, state.setSelectedProject]);
  const notify = useToastNotification();

  const dueDateObj = useMemo(() => getBusinessDate(3), []);
  const formattedDueDate = useMemo(() => dueDateObj.toLocaleDateString("en-GB"), [dueDateObj]);

  const activeWebpage = webpage ?? confirmedPage?.page;
  const showForm = activeWebpage !== undefined;

  const handleDescrChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescr(e.target.value);
  };

  const handleLinkChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewCopydocLink(e.target.value);
    setLinkError(null);
  };

  const handleClose = useCallback(() => {
    onClose();
    setDescr("");
    setNewCopydocLink("");
    setLinkError(null);
    setSelectedPage(null);
    setConfirmedPage(null);
  }, [onClose]);

  const viewTicket = (ticketId: string) => {
    window.open(`${config.jiraTaskLink}${ticketId}`, "_blank");
  };

  const handleSuccess = useCallback(async () => {
    handleClose();

    if (activeWebpage) {
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
    }
  }, [handleClose, refetch, selectedProject?.name, setSelectedProject, activeWebpage]);

  const onSubmitError = useCallback(
    (error: AxiosError<IBasicApiError>) => {
      const { message, description } = parseError(error);
      notify.failure(message, null, <p>{description}</p>);
    },
    [notify],
  );

  const onSubmitFinally = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!activeWebpage?.id) return;

      const hasExistingLink = !!activeWebpage.copy_doc_link;
      const linkToSubmit = hasExistingLink ? activeWebpage.copy_doc_link : newCopydocLink;

      if (!hasExistingLink) {
        const trimmedLink = newCopydocLink.trim();
        if (!trimmedLink) {
          setLinkError("This is a required field");
          return;
        }
        if (!COPYDOC_URL_REGEX.test(trimmedLink)) {
          setLinkError("Please enter a valid Google Docs URL");
          return;
        }
      }

      setIsLoading(true);
      const url = (activeWebpage?.project?.name ?? "") + activeWebpage.url;
      const requestSummary = hasExistingLink ? "Copy update request for " + url : "Add new copydoc for " + url;

      PagesServices.requestChanges({
        due_date: dueDateObj.toISOString().split("T")[0],
        webpage_id: activeWebpage.id,
        reporter_struct: user,
        type: ChangeRequestType.COPY_UPDATE,
        summary: requestSummary,
        description: `Copy doc link: ${linkToSubmit} \n${descr}`,
        request_type: Object.keys(ChangeRequestType).find(
          (key) => ChangeRequestType[key as keyof typeof ChangeRequestType] === ChangeRequestType.COPY_UPDATE,
        ) as string,
      })
        .then((response) => {
          if (!response) return;

          const data = response.data;
          const notificationActions = [
            {
              label: "View on Jira",
              onClick: () => viewTicket(data.jira_task_id),
            },
          ];

          if (window.location.pathname !== "/app") {
            notificationActions.push({
              label: "View your requests",
              onClick: () => {
                window.location.href = "/app";
              },
            });
          }

          notify.success(
            "Your update will be applied within 3 business days. You can follow our progress on Jira or in your requests.",
            notificationActions,
            "You submitted a copy update",
          );

          handleSuccess();
        })
        .catch(onSubmitError)
        .finally(onSubmitFinally);
    },
    [
      activeWebpage,
      newCopydocLink,
      dueDateObj,
      user,
      descr,
      onSubmitError,
      onSubmitFinally,
      handleSuccess,
      notify,
      viewTicket,
    ],
  );

  return (
    <SidePanel className="request-copydoc-panel" isOpen={isOpen} overlay>
      <SidePanel.Sticky>
        <SidePanel.Header>
          <SidePanel.HeaderTitle className="u-no-padding--top">
            <span className="p-panel__header-text">Request copy update</span>
            <span>
              <Tooltip
                message={
                  <div className="u-align-text--center">
                    Edit text in a section, replace images, <br />
                    or copy a section
                  </div>
                }
                position="btm-center"
                zIndex={999}
              >
                <div>
                  <Icon name="information" />
                </div>
              </Tooltip>
            </span>
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
          <form id="copydoc-update-form" onSubmit={handleSubmit}>
            <p>
              <strong>Update your copy doc and submit</strong>
            </p>
            <div className="u-sv1">
              {activeWebpage.copy_doc_link ? (
                <p className="u-sv-1">
                  1. Open the{" "}
                  <a href={activeWebpage.copy_doc_link} rel="noreferrer" target="_blank">
                    copy doc of your page <Icon name="external-link" />
                  </a>
                </p>
              ) : (
                <div className="u-sv-1">
                  <Textarea
                    error={linkError || undefined}
                    label="1. Add a link to your copy doc"
                    onChange={handleLinkChange}
                    placeholder="Copy doc URL"
                    rows={1}
                    value={newCopydocLink}
                  />
                </div>
              )}

              <p className="u-sv-2">2. Edit your copy doc in 'Suggested' mode</p>
              <Textarea
                label="3. Add a description (optional)"
                onChange={handleDescrChange}
                placeholder="Additional details or context"
                rows={7}
              />
            </div>
            <p>Assigned due date: {formattedDueDate}</p>
            <p className="u-text--muted p-text--small u-sv-2">
              Copy updates are applied within 3 business days of your request
            </p>
          </form>
        ) : (
          <>
            <p className="p-heading--5 u-no-margin--bottom u-sv1">Choose the page you want to update</p>
            <PageSearch<IPageOption>
              hideTitle
              onClear={() => setSelectedPage(null)}
              onSelect={setSelectedPage}
              options={pageOptions}
              placeholder="Search by page URL"
              value={selectedPage}
            />
          </>
        )}
      </SidePanel.Content>

      <SidePanel.Sticky>
        <SidePanel.Footer className="u-align--right">
          <Button onClick={handleClose}>Cancel</Button>
          {showForm ? (
            <ActionButton
              appearance="positive"
              disabled={isLoading}
              form="copydoc-update-form"
              loading={isLoading}
              type="submit"
            >
              Submit
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

export default RequestCopydocPanel;
