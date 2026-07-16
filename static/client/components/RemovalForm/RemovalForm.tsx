import { useCallback, useState } from "react";
import type { FormEvent } from "react";

import { ConfirmationModal, Input, Textarea, useToastNotification } from "@canonical/react-components";
import type { AxiosError } from "axios";

import type { IRemovalFormProps } from "./RemovalForm.types";

import PageSearch from "@/components/Search";
import config from "@/config";
import { type IPageOption, usePageOptions } from "@/helpers/usePageOptions";
import type { IBasicApiError } from "@/services/api/partials/BasicApiClass";
import { PagesServices } from "@/services/api/services/pages";
import { ChangeRequestType, PageStatus } from "@/services/api/types/pages";
import { DatesServices } from "@/services/dates";
import { useStore } from "@/store";

function viewTicket(ticketId: string) {
  window.open(`${config.jiraTaskLink}${ticketId}`, "_blank");
}

const RemovalForm = ({ webpage, onSuccess, onLoadingChange }: IRemovalFormProps) => {
  const notify = useToastNotification();
  const reporter = useStore((state) => state.user);

  const urlOptions = usePageOptions(webpage.id);

  const [redirectPage, setRedirectPage] = useState<IPageOption | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isNewPage = webpage.status === PageStatus.NEW;

  const [errors, setErrors] = useState<{ redirectPage?: string; dueDate?: string }>({});

  const updateLoading = useCallback(
    (value: boolean) => {
      setLoading(value);
      onLoadingChange?.(value);
    },
    [onLoadingChange],
  );

  const handleSubmitClick = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      if (isNewPage) {
        setShowConfirmation(true);
        return;
      }

      const newErrors: { redirectPage?: string; dueDate?: string } = {};
      if (!redirectPage) newErrors.redirectPage = "This is a required field";
      if (!dueDate) newErrors.dueDate = "This is a required field";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});
      setShowConfirmation(true);
    },
    [dueDate, isNewPage, redirectPage],
  );

  const handleClearRedirectPage = useCallback(() => {
    setRedirectPage(null);
  }, []);

  const handleSelectRedirectPage = useCallback((option: IPageOption) => {
    setRedirectPage(option);
    setErrors((prev) => ({ ...prev, redirectPage: undefined }));
  }, []);

  const onSubmitError = useCallback(
    (error: AxiosError<IBasicApiError>) => {
      if (error?.response?.data) {
        notify.failure(error.response.data?.error, null, <p>{error.response.data?.description}</p>);
      }
    },
    [notify],
  );

  const handleConfirmSubmit = useCallback(() => {
    if (!webpage?.id || loading) return;
    updateLoading(true);
    setShowConfirmation(false);

    PagesServices.requestRemoval({
      due_date: dueDate || undefined,
      webpage_id: webpage.id,
      reporter_struct: reporter,
      description,
      redirect_url: redirectPage?.name || "",
      request_type: Object.keys(ChangeRequestType).find(
        (key) => ChangeRequestType[key as keyof typeof ChangeRequestType] === ChangeRequestType.PAGE_REMOVAL,
      ) as string,
    })
      .then((response) => {
        notify.success(
          "The Content Team will review your request. Once removed, your page will not appear in the Content System.",
          [
            {
              label: "View on Jira",
              onClick: () => viewTicket(response.data.jira_task_id),
            },
          ],
          "You submitted a request to remove a page",
        );
        onSuccess();
      })
      .catch(onSubmitError)
      .finally(() => updateLoading(false));
  }, [
    description,
    dueDate,
    loading,
    notify,
    onSubmitError,
    onSuccess,
    redirectPage?.name,
    reporter,
    updateLoading,
    webpage.id,
  ]);

  const fullPageUrl = webpage.project?.name ? `${webpage.project.name}${webpage.name}` : "";

  return (
    <>
      <form id="removal-form" onSubmit={handleSubmitClick}>
        <p>
          <strong>{fullPageUrl}</strong> will be permanently deleted from the website and the Content System.
        </p>
        {!isNewPage && (
          <div className="u-sv3">
            <p className="u-no-margin--bottom u-sv1">1. Assign a page to redirect to</p>
            <PageSearch<IPageOption>
              error={errors.redirectPage}
              onClear={handleClearRedirectPage}
              onSelect={handleSelectRedirectPage}
              options={urlOptions}
              placeholder="Search by page title or URL"
              value={redirectPage}
            />
          </div>
        )}
        <Textarea
          label="2. Add a description (optional)"
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details or context"
          rows={7}
        />
        {(!isNewPage || window.__E2E_TESTING__) && (
          <Input
            className="u-sv1"
            error={errors.dueDate}
            label="3. Request a preferred delivery date"
            min={DatesServices.getNowStr()}
            onChange={(e) => {
              setDueDate(e.target.value);
              setErrors((prev) => ({ ...prev, dueDate: undefined }));
            }}
            type="date"
          />
        )}
        <p className="u-text--muted p-text--small">
          Page removals can be completed within 3 business days of your request
        </p>
      </form>
      {showConfirmation && (
        <ConfirmationModal
          close={() => setShowConfirmation(false)}
          confirmButtonAppearance="negative"
          confirmButtonLabel="Remove"
          onConfirm={handleConfirmSubmit}
          title={`Remove ${fullPageUrl}?`}
        >
          <p>
            Once removed from the website, it will not appear in the Content System. You can follow our progress on Jira
            or in your requests.
          </p>
        </ConfirmationModal>
      )}
    </>
  );
};

export default RemovalForm;
