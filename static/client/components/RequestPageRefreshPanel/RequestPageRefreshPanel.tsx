import { type ChangeEvent, type FormEvent, useCallback, useState, type ReactNode } from "react";
import React from "react";

import {
  ActionButton,
  Button,
  Icon,
  Input,
  Select,
  SidePanel,
  Textarea,
  Tooltip,
  useToastNotification,
} from "@canonical/react-components";
import type { AxiosError } from "axios";
import { useQueryClient } from "react-query";

import type { IRequestPageRefreshPanel } from "./RequestPageRefreshPanel.types";

import PageSearch from "@/components/Search";
import config from "@/config";
import { parseError } from "@/helpers/requests";
import { type IPageOption, usePageOptions } from "@/helpers/usePageOptions";
import { useTeams } from "@/services/api/hooks/teams";
import type { IBasicApiError } from "@/services/api/partials/BasicApiClass";
import { PagesServices } from "@/services/api/services/pages";
import { ChangeRequestType } from "@/services/api/types/pages";
import { DatesServices } from "@/services/dates";
import { useStore } from "@/store";

const COPYDOC_URL_REGEX = /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+/;

type Step = "select" | "form";

const RequestPageRefreshPanel = ({ isOpen, onClose, webpage }: IRequestPageRefreshPanel): ReactNode => {
  const [step, setStep] = useState<Step>(webpage ? "form" : "select");
  const [selectedPage, setSelectedPage] = useState<IPageOption | null>(null);
  const [confirmedPage, setConfirmedPage] = useState<IPageOption | null>(null);
  const [newCopydocLink, setNewCopydocLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [team, setTeam] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const pageOptions = usePageOptions();
  const { data: teams } = useTeams();
  const user = useStore((state) => state.user);
  const notify = useToastNotification();
  const queryClient = useQueryClient();

  const activeWebpage = webpage ?? confirmedPage?.page;

  const teamOptions = [
    { value: "", label: "Select a team", disabled: true },
    ...(teams?.map((t) => ({ value: t.name, label: t.name })) ?? []),
  ];

  const copydocLink = activeWebpage?.copy_doc_link || newCopydocLink.trim();
  const submitDisabled = !team || !copydocLink || !deliveryDate || isLoading;

  const handleClose = useCallback(() => {
    onClose();
    setStep(webpage ? "form" : "select");
    setSelectedPage(null);
    setConfirmedPage(null);
    setNewCopydocLink("");
    setLinkError(null);
    setTeam("");
    setSummary("");
    setDescription("");
    setDeliveryDate("");
    setIsLoading(false);
  }, [onClose, webpage]);

  const handleNext = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (selectedPage) {
      setConfirmedPage(selectedPage);
      setStep("form");
    }
  }, [selectedPage]);

  const onSubmitError = useCallback(
    (error: AxiosError<IBasicApiError>) => {
      const { message, description: errorDescription } = parseError(error);
      notify.failure(message, null, <p>{errorDescription}</p>);
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
      const copydocToSend = hasExistingLink ? activeWebpage.copy_doc_link : newCopydocLink.trim();

      if (!hasExistingLink) {
        if (!copydocToSend) {
          setLinkError("This is a required field");
          return;
        }
        if (!COPYDOC_URL_REGEX.test(copydocToSend)) {
          setLinkError("Please enter a valid Google Docs URL");
          return;
        }
      }

      const pageUrl = (activeWebpage.project?.name ?? "") + activeWebpage.url;
      const requestSummary = summary.trim() || `Refresh ${pageUrl}`;

      setIsLoading(true);

      PagesServices.requestChanges({
        due_date: deliveryDate,
        webpage_id: activeWebpage.id,
        reporter_struct: user,
        type: ChangeRequestType.PAGE_REFRESH,
        summary: requestSummary,
        description,
        request_type: Object.keys(ChangeRequestType).find(
          (key) => ChangeRequestType[key as keyof typeof ChangeRequestType] === ChangeRequestType.PAGE_REFRESH,
        ) as string,
        copy_doc_link: !hasExistingLink ? copydocToSend : undefined,
      })
        .then((response) => {
          if (!response) return;

          const data = response.data;
          const notificationActions = [
            {
              label: "View on Jira",
              onClick: () => {
                window.open(`${config.jiraTaskLink}${data.jira_task_id}`, "_blank");
              },
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
            "Your request has been submitted. You can follow our progress on Jira or in your requests.",
            notificationActions,
            "You submitted a page refresh request",
          );

          queryClient.invalidateQueries("tickets").catch(() => {});
        })
        .catch(onSubmitError)
        .finally(onSubmitFinally);
    },
    [activeWebpage, newCopydocLink, summary, description, deliveryDate, user, notify, queryClient, onSubmitError, onSubmitFinally],
  );

  return (
    <SidePanel className="request-page-refresh-panel" isOpen={isOpen} overlay>
      <SidePanel.Sticky>
        <SidePanel.Header>
          <SidePanel.HeaderTitle className="u-no-padding--top">
            <span className="p-panel__header-text">Refresh page</span>
            <span>
              <Tooltip
                message={
                  <div className="u-align-text--center">
                    Change the page layout, such as<br />
                    adding or replacing a section.
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
        {step === "select" ? (
          <>
            <p className="p-heading--5 u-no-margin--bottom u-sv1">Choose the page you want to refresh</p>
            <PageSearch<IPageOption>
              onClear={() => setSelectedPage(null)}
              onSelect={setSelectedPage}
              options={pageOptions}
              placeholder="Search by page title or URL"
              value={selectedPage}
            />
          </>
        ) : (
          <form id="page-refresh-form" onSubmit={handleSubmit}>
            <p>
              <strong>Update your copy doc and submit</strong>
            </p>
            <div className="u-sv1">
              {activeWebpage?.copy_doc_link ? (
                <p className="u-sv-1">
                  1. Open the{" "}
                  <a href={activeWebpage.copy_doc_link} rel="noreferrer" target="_blank">
                    copy doc of your page <Icon name="external-link" />
                  </a>
                </p>
              ) : (
                <div className="u-sv-1">
                  <Input
                    error={linkError || undefined}
                    id="page-refresh-copydoc-link-input"
                    label="1. Add a link to your copy doc"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setNewCopydocLink(e.target.value);
                      setLinkError(null);
                    }}
                    placeholder="Copy doc URL"
                    type="text"
                    value={newCopydocLink}
                  />
                </div>
              )}
              <p className="u-sv-2">2. Edit your copy doc in &apos;Suggested&apos; mode</p>
              <Select
                label="Team"
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setTeam(e.target.value)}
                options={teamOptions}
                value={team}
              />
              <Input
                label="Summary"
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSummary(e.target.value)}
                placeholder={
                  activeWebpage
                    ? `Refresh ${(activeWebpage.project?.name ?? "") + activeWebpage.url}`
                    : "Summary"
                }
                type="text"
                value={summary}
              />
              <Textarea
                label="Description (optional)"
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Additional details or context"
                rows={5}
                value={description}
              />
              <Input
                label="Preferred delivery date"
                min={DatesServices.getNowStr()}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDeliveryDate(e.target.value)}
                type="date"
                value={deliveryDate}
              />
            </div>
          </form>
        )}
      </SidePanel.Content>

      <SidePanel.Sticky>
        <SidePanel.Footer className="u-align--right">
          <Button onClick={handleClose}>Cancel</Button>
          {step === "select" ? (
            <Button appearance="positive" disabled={!selectedPage} onClick={handleNext} type="button">
              Next
            </Button>
          ) : (
            <ActionButton
              appearance="positive"
              disabled={submitDisabled}
              form="page-refresh-form"
              loading={isLoading}
              type="submit"
            >
              Submit
            </ActionButton>
          )}
        </SidePanel.Footer>
      </SidePanel.Sticky>
    </SidePanel>
  );
};

export default RequestPageRefreshPanel;
