import { useCallback, useMemo, useState } from "react";

import {
  ActionButton,
  Button,
  ConfirmationModal,
  Icon,
  Input,
  SidePanel,
  Textarea,
  Tooltip,
  useToastNotification,
} from "@canonical/react-components";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import type { IRequestRemovalPanelProps } from "./RequestRemovalPanel.types";

import CustomSearchAndFilter from "@/components/Common/CustomSearchAndFilter";
import { usePages } from "@/services/api/hooks/pages";
import type { IBasicApiError } from "@/services/api/partials/BasicApiClass";
import { PagesServices } from "@/services/api/services/pages";
import type { IPage } from "@/services/api/types/pages";
import { ChangeRequestType, PageStatus } from "@/services/api/types/pages";
import { DatesServices } from "@/services/dates";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";
import { flattenPages } from "@/utils/flattenPages";

const RequestRemovalPanel = ({ webpage }: IRequestRemovalPanelProps) => {
  const notify = useToastNotification();
  const navigate = useNavigate();
  const requestRemovalPanelVisible = usePanelsStore((state) => state.requestRemovalPanelVisible);
  const toggleRequestRemovalPanel = usePanelsStore((state) => state.toggleRequestRemovalPanel);
  const reporter = useStore((state) => state.user);

  const selectedProject = useStore((state) => state.selectedProject);
  const setSelectedProject = useStore((state) => state.setSelectedProject);

  const { refetch } = usePages(true);

  const [redirectPage, setRedirectPage] = useState<IPage | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isNewPage = webpage.status === PageStatus.NEW;

  const pages = useMemo(() => {
    if (!selectedProject?.templates) return [];
    return flattenPages(selectedProject.templates, webpage.id);
  }, [selectedProject?.templates, webpage.id]);
  console.log("🚀 ~ RequestRemovalPanel ~ pages:", pages);

  const submitButtonEnabled = useMemo(() => {
    if (loading) return false;
    if (isNewPage) return true;
    return !!dueDate && !!redirectPage;
  }, [dueDate, isNewPage, loading, redirectPage]);

  const handleRemoveRedirectPage = useCallback(
    () => () => {
      setRedirectPage(null);
    },
    [],
  );

  const handleSelectRedirectPage = useCallback((option: IPage) => {
    setRedirectPage(option);
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
    if (!webpage?.id) return;
    setLoading(true);
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
      .then(() => {
        toggleRequestRemovalPanel();
        notify.success("The page removal request has been submitted successfully.");

        const afterRefetch = () => {
          if (webpage.status === PageStatus.NEW) {
            navigate("/app", { replace: true });
          } else {
            window.location.reload();
          }
        };

        if (refetch) {
          refetch().then((data) => {
            if (data?.length) {
              const project = data.find((p) => p.data?.name === selectedProject?.name);
              if (project && project.data) {
                setSelectedProject(project.data);
              }
            }
            afterRefetch();
          });
        } else {
          afterRefetch();
        }
      })
      .catch(onSubmitError)
      .finally(() => setLoading(false));
  }, [
    description,
    dueDate,
    navigate,
    notify,
    onSubmitError,
    redirectPage?.name,
    refetch,
    reporter,
    selectedProject?.name,
    setSelectedProject,
    toggleRequestRemovalPanel,
    webpage.id,
    webpage.status,
  ]);

  const fullPageUrl = webpage.project?.name ? `${webpage.project.name}${webpage.name}` : "";

  return (
    <SidePanel isOpen={requestRemovalPanelVisible} overlay>
      <SidePanel.Sticky>
        <SidePanel.Header>
          <SidePanel.HeaderTitle>
            Remove page{" "}
            <Tooltip
              message="Archive and set up redirects for a page on our website."
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
              onClick={toggleRequestRemovalPanel}
            >
              <Icon name="close" />
            </Button>
          </SidePanel.HeaderControls>
        </SidePanel.Header>
      </SidePanel.Sticky>
      <SidePanel.Content>
        <p>
          <strong>{fullPageUrl}</strong> will be permanently deleted from the website and the Content System.
        </p>
        {!isNewPage && (
          <div className="u-sv1">
            <CustomSearchAndFilter<IPage>
              indexKey="id"
              label="1. Assign a page to redirect to"
              labelKey="name"
              onRemove={handleRemoveRedirectPage}
              onSelect={handleSelectRedirectPage}
              options={pages}
              placeholder="Search by page title or URL"
              selectedOptions={redirectPage ? [redirectPage] : []}
            />
          </div>
        )}
        <Textarea
          className="u-sv1"
          label="2. Add a description (optional)"
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details or context"
          rows={5}
        />
        {(!isNewPage || window.__E2E_TESTING__) && (
          <Input
            className="u-sv1"
            label="3. Request a preferred delivery date"
            min={DatesServices.getNowStr()}
            onChange={(e) => setDueDate(e.target.value)}
            required
            type="date"
          />
        )}
        <p className="u-text--muted p-text--small">
          Page removals can be completed within 3 business days of your request
        </p>
      </SidePanel.Content>
      <SidePanel.Sticky position="bottom">
        <SidePanel.Footer className="u-align--right">
          <Button onClick={toggleRequestRemovalPanel}>Cancel</Button>
          <ActionButton
            appearance="negative"
            disabled={!submitButtonEnabled}
            loading={loading}
            onClick={() => setShowConfirmation(true)}
          >
            Remove page
          </ActionButton>
        </SidePanel.Footer>
      </SidePanel.Sticky>
      {showConfirmation && (
        <ConfirmationModal
          close={() => setShowConfirmation(false)}
          confirmButtonAppearance="negative"
          confirmButtonLabel="Remove"
          onConfirm={handleConfirmSubmit}
          title={`Remove ${fullPageUrl}?`}
        >
          <p>
            Once it is removed from the website, it will not be visible in the Content System. You can follow our
            progress on Jira or in your requests.
          </p>
        </ConfirmationModal>
      )}
    </SidePanel>
  );
};

export default RequestRemovalPanel;
