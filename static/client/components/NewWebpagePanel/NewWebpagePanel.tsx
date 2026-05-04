import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  ActionButton,
  Button,
  Icon,
  Input,
  Modal,
  PrefixedInput,
  Select,
  SidePanel,
  Spinner,
  Textarea,
  Tooltip,
  useToastNotification,
} from "@canonical/react-components";
import type { AxiosError } from "axios";
import { useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";

import ComboSelect from "@/components/Common/ComboSelect";
import MultiSelectPicker from "@/components/Common/MultiSelectPicker";
import PageSearch from "@/components/Search";
import config from "@/config";
import { useQueryParams } from "@/helpers/hooks";
import { parseError } from "@/helpers/requests";
import type { IPageOption } from "@/helpers/usePageOptions";
import { usePageOptions } from "@/helpers/usePageOptions";
import { useJiraProjects } from "@/services/api/hooks/jiraProjects";
import { usePages } from "@/services/api/hooks/pages";
import { useProducts } from "@/services/api/hooks/products";
import { useUsers } from "@/services/api/hooks/users";
import type { IBasicApiError } from "@/services/api/partials/BasicApiClass";
import { PagesServices } from "@/services/api/services/pages";
import type { IJiraProject } from "@/services/api/types/jira";
import type { IProduct } from "@/services/api/types/products";
import type { IUser } from "@/services/api/types/users";
import { insertPage } from "@/services/tree/pages";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";

const initialFormData = {
  site: config.allProjects[0] || "",
  location: "",
  copydoc: "",
  summary: "",
  date: "",
  pageType: "Webpage",
  parent: null as IPageOption | null,
};

const COPYDOC_URL_REGEX = /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+/;

// Extracted to module level to avoid recreating these static arrays on every render
const SITE_OPTIONS = config.allProjects.map((project) => ({ label: project, value: project }));

const PAGE_TYPE_OPTIONS = [
  { label: "Webpage", value: "Webpage" },
  { label: "Case study", value: "Case study" },
];

type Step1Props = {
  site: string;
  parent: IPageOption | null;
  location: string;
  pageType: string;
  copydoc: string;
  onSiteChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onParentChange: (option: IPageOption | null) => void;
  onLocationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCopydocChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

const Step1Content = React.memo(function Step1Content({
  site,
  parent,
  location,
  pageType,
  copydoc,
  onSiteChange,
  onLocationChange,
  onCopydocChange,
  onPageTypeChange,
  onParentChange,
}: Step1Props) {
  const pageOptions = usePageOptions();

  // Memoized so PageSearch doesn't receive a new function reference on every Step1Content render
  const filterFn = useCallback((opt: IPageOption) => opt.page.project?.name === site, [site]);
  const handleClear = useCallback(() => onParentChange(null), [onParentChange]);

  return (
    <>
      <p>
        <strong>Add your page information</strong>
      </p>
      <Select label="1. Choose the site" onChange={onSiteChange} options={SITE_OPTIONS} value={site} />
      <p className="u-no-margin--bottom u-sv1">2. Select the bubble</p>
      <PageSearch<IPageOption>
        filterFn={filterFn}
        onClear={handleClear}
        onSelect={onParentChange}
        options={pageOptions}
        placeholder="Search by page title or URL"
        value={parent}
      />
      <PrefixedInput
        aria-required
        className="u-sv2"
        immutableText="/"
        label="3. Add the preferred URL"
        onChange={onLocationChange}
        value={location}
      />
      <p className="p-text--small u-text--muted">
        The URL for this new page will be: {site}
        {parent ? `${parent.page.url}/` : "/"}
        {location}
      </p>
      <Select label="4. Page type" onChange={onPageTypeChange} options={PAGE_TYPE_OPTIONS} value={pageType} />
      <Input
        aria-required
        className="u-sv2"
        error={copydoc && !COPYDOC_URL_REGEX.test(copydoc) ? "Please enter a valid Google Docs URL" : ""}
        label="5. Add a link to your copy doc"
        onChange={onCopydocChange}
        type="text"
        value={copydoc}
      />
      <p className="p-text--small u-text--muted">
        If you don't have a copy doc yet, use{" "}
        <a
          href="https://docs.google.com/document/d/1EPA_Ea8ShIvyftAc9oVxZYUIMHfAPFF6S5x6FOvLkwM/edit?tab=t.ly9ghy9ilvf#heading=h.krz2ku7u3755"
          rel="noopener noreferrer"
          target="_blank"
        >
          our template
        </a>{" "}
        to create one.
      </p>
    </>
  );
});

type Step2Props = {
  owner: IUser | null;
  team: IJiraProject | null;
  reviewers: IUser[];
  selectedProducts: IProduct[];
  users: IUser[] | undefined;
  jiraProjects: IJiraProject[];
  products: IProduct[];
  summary: string;
  date: string;
  loadingJiraProjects: boolean;
  onOwnerSelect: (selected: IUser | null) => void;
  onTeamSelect: (selected: IJiraProject | null) => void;
  onReviewersSelect: (selected: unknown) => void;
  onSummaryChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onProductsSelect: (selected: unknown) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const Step2Content = React.memo(function Step2Content({
  owner,
  team,
  reviewers,
  selectedProducts,
  users,
  jiraProjects,
  products,
  summary,
  date,
  loadingJiraProjects,
  onOwnerSelect,
  onTeamSelect,
  onReviewersSelect,
  onSummaryChange,
  onProductsSelect,
  onDateChange,
}: Step2Props) {
  return (
    <>
      <p>
        <strong>Add your request information and submit</strong>
      </p>
      <div className="u-sv2">
        <label className="p-form__label" htmlFor="owner-select">
          1. Choose the page owner (if other than yourself)
        </label>
        <ComboSelect<IUser>
          id="owner-select"
          indexKey="email"
          labelKey="name"
          onSelect={onOwnerSelect}
          options={users ?? []}
          placeholder={owner ? owner.name : "Search for an owner..."}
          searchKeys={["name", "email"]}
          value={owner}
        />
      </div>
      <div className="u-sv2">
        <label className="p-form__label" htmlFor="contributors-select">
          Add Contributor(s)
        </label>
        <MultiSelectPicker<IUser>
          id="contributors-select"
          indexKey="email"
          labelKey="name"
          onSelect={onReviewersSelect}
          options={users ?? []}
          placeholder={reviewers.length ? reviewers.map((r) => r.name).join(", ") : "Search for contributors..."}
          searchKeys={["name", "email"]}
          value={reviewers}
        />
      </div>
      <div className="u-sv2">
        <label className="p-form__label" htmlFor="team-select">
          3. Choose your team
        </label>
        {loadingJiraProjects ? (
          <div>
            <Spinner text="Loading Jira projects ..." />
          </div>
        ) : (
          <div>
            <ComboSelect<IJiraProject>
              className="u-sv1"
              id="team-select"
              indexKey="id"
              labelKey="name"
              onSelect={onTeamSelect}
              options={jiraProjects ?? []}
              placeholder={team ? team.name : "Search for a team..."}
              searchKeys={["name"]}
              value={team}
            />
            <p className="p-text--small u-text--muted">This will help us assign the task to correct Jira board</p>
          </div>
        )}
      </div>
      <Textarea
        aria-required
        className="u-sv1"
        label="4. Add a summary"
        onChange={onSummaryChange}
        placeholder="Add details and context, such as the stakeholders and intended users"
        rows={5}
        value={summary}
      />
      <div className="u-sv2">
        <label className="p-form__label" htmlFor="products-select">
          5. Tag products
        </label>
        <MultiSelectPicker<IProduct>
          id="products-select"
          indexKey="id"
          labelKey="name"
          onSelect={onProductsSelect}
          options={products}
          placeholder={
            selectedProducts.length ? selectedProducts.map((p) => p.name).join(", ") : "Search for products..."
          }
          searchKeys={["name", "id"]}
          value={selectedProducts}
        />
        <p className="p-text--small u-text--muted p-tags-help-text">These tags will be housed in the content system</p>
      </div>
      <Input label="6. Request a preferred delivery date" onChange={onDateChange} type="date" value={date} />
    </>
  );
});

const NewWebpagePanel = () => {
  const notify = useToastNotification();
  const [newWebpagePanelVisible, toggleNewWebpagePanel] = usePanelsStore((state) => [
    state.newWebpagePanelVisible,
    state.toggleNewWebpagePanel,
  ]);
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState(initialFormData);

  const [owner, setOwner] = useState<IUser | null>(null);
  const [team, setTeam] = useState<IJiraProject | null>(null);
  const [reviewers, setReviewers] = useState<IUser[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<IProduct[]>([]);

  const handleSelectSite = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, site: e.target.value }));
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, location: e.target.value }));
  }, []);

  const handleParentChange = useCallback((selected: IPageOption | null) => {
    setFormData((prev) => ({ ...prev, parent: selected || null }));
  }, []);

  const handlePageTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, pageType: e.target.value }));
  }, []);

  const handleCopydocChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, copydoc: e.target.value }));
  }, []);

  const handleOwnerSelect = useCallback((selected: IUser | null) => {
    setOwner(selected);
  }, []);

  const handleTeamSelect = useCallback((selected: IJiraProject | null) => {
    setTeam(selected);
  }, []);

  const handleReviewersSelect = useCallback((selected: unknown) => {
    setReviewers(selected as IUser[]);
  }, []);

  const handleSummaryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, summary: e.target.value }));
  }, []);

  const handleProductsSelect = useCallback((selected: unknown) => {
    setSelectedProducts(selected as IProduct[]);
  }, []);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, date: e.target.value }));
  }, []);

  const submitButtonEnabled = formData.location.trim().length > 0 && formData.summary.trim().length > 0 && !loading;

  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const queryParams = useQueryParams();

  const onSubmitError = useCallback(
    (error: AxiosError<IBasicApiError>) => {
      const { message, description } = parseError(error);
      notify.failure(message, null, <p>{description}</p>);
    },
    [notify],
  );

  const navigate = useNavigate();
  const setSelectedProject = useStore((state) => state.setSelectedProject);
  const queryClient = useQueryClient();
  const { data: pages } = usePages(true);

  // Latest-ref pattern: stores mutable form values so onSubmit is never re-created on form changes,
  // yet always reads the up-to-date values at call-time (no stale closure risk).
  const onSubmitParamsRef = useRef({ formData, owner, reviewers, selectedProducts, team, pages });
  onSubmitParamsRef.current = { formData, owner, reviewers, selectedProducts, team, pages };

  const onSubmit = useCallback(
    (saveForLater: boolean) => {
      const { formData, owner, reviewers, selectedProducts, team, pages } = onSubmitParamsRef.current;
      setLoading(true);
      const data = {
        project: formData.site,
        name: `${formData.parent?.page?.url || ""}/${formData.location}`,
        copy_doc_link: formData.copydoc,
        owner: owner,
        reviewers: reviewers,
        parent: formData.parent?.page?.url || "",
        product_ids: selectedProducts.map((p) => p.id),
        content_jira_id: queryParams.get("content_jira_id") || "",
        page_type: formData.pageType,
        team: team?.id,
        summary: formData.summary,
        due_date: formData.date,
        save_for_later: saveForLater,
      };

      PagesServices.createPage(data)
        .then(async (response) => {
          toggleNewWebpagePanel();
          const new_webpage = response.data.webpage;

          if (new_webpage.project && new_webpage.project.name) {
            insertPage(new_webpage, queryClient);

            if (data.save_for_later) {
              notify.success(
                "You requested a new page",
                [
                  {
                    label: "Open page view",
                    onClick: () => {
                      const project = pages?.find((p) => p.name === new_webpage.project?.name);
                      if (project) setSelectedProject(project);
                      navigate(`/app/webpage/${new_webpage.project?.name}${new_webpage.url}`);
                    },
                  },
                ],
                "You must submit for content review to complete the request.",
              );
            } else {
              notify.success("The Content team will review your page.", [], "Your new page request is in review");
            }
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["pages"] }),
              queryClient.invalidateQueries({ queryKey: ["tickets"] }),
            ]);
          } else {
            throw new Error("Error creating a new webpage.");
          }
        })
        .catch(onSubmitError)
        .finally(() => {
          setLoading(false);
          setSuccessModalOpen(false);
        });
    },
    [queryParams, onSubmitError, toggleNewWebpagePanel, queryClient, notify, setSelectedProject, navigate],
  );

  const { data: users } = useUsers();
  const { data: jiraProjects = [], isLoading: loadingJiraProjects = false } = useJiraProjects();
  const [currentStep, setCurrentStep] = useState(1);

  const nextButtonEnabled =
    !!formData.site &&
    formData.location.trim().length > 0 &&
    formData.copydoc.trim().length > 0 &&
    COPYDOC_URL_REGEX.test(formData.copydoc);

  useEffect(() => {
    setOwner(user);
  }, [user]);

  useEffect(() => {
    if (!newWebpagePanelVisible) {
      setFormData(initialFormData);
      setOwner(user);
      setTeam(null);
      setReviewers([]);
      setSelectedProducts([]);
      setCurrentStep(1);
    }
  }, [newWebpagePanelVisible, user]);

  const { data: products = [] } = useProducts();

  function renderCurrentFooter() {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Button onClick={toggleNewWebpagePanel}>Cancel</Button>
            <ActionButton appearance="positive" disabled={!nextButtonEnabled} onClick={() => setCurrentStep(2)}>
              Next
            </ActionButton>
          </>
        );
      case 2:
        return (
          <>
            <Button onClick={() => setCurrentStep(1)}>Previous</Button>
            <ActionButton
              appearance="positive"
              disabled={loading || !submitButtonEnabled}
              loading={loading}
              onClick={() => setSuccessModalOpen(true)}
            >
              Submit
            </ActionButton>
          </>
        );
    }
  }

  return (
    <>
      <SidePanel isOpen={newWebpagePanelVisible}>
        <SidePanel.Sticky>
          <SidePanel.Header>
            <SidePanel.HeaderTitle>
              Request new webpage{" "}
              <Tooltip message="Request a new page to add a URL to one of our sites" position="btm-center" zIndex={999}>
                <Icon name="information" size={16} />
              </Tooltip>
            </SidePanel.HeaderTitle>
            <SidePanel.HeaderControls>
              <Button
                appearance="base"
                aria-label="Close"
                className="u-no-margin--bottom"
                hasIcon
                onClick={toggleNewWebpagePanel}
              >
                <Icon name="close" />
              </Button>
            </SidePanel.HeaderControls>
          </SidePanel.Header>
        </SidePanel.Sticky>
        <SidePanel.Content>
          {currentStep === 1 && (
            <Step1Content
              copydoc={formData.copydoc}
              location={formData.location}
              onCopydocChange={handleCopydocChange}
              onLocationChange={handleLocationChange}
              onPageTypeChange={handlePageTypeChange}
              onParentChange={handleParentChange}
              onSiteChange={handleSelectSite}
              pageType={formData.pageType}
              parent={formData.parent}
              site={formData.site}
            />
          )}
          {currentStep === 2 && (
            <Step2Content
              date={formData.date}
              jiraProjects={jiraProjects}
              loadingJiraProjects={loadingJiraProjects}
              onDateChange={handleDateChange}
              onOwnerSelect={handleOwnerSelect}
              onProductsSelect={handleProductsSelect}
              onReviewersSelect={handleReviewersSelect}
              onSummaryChange={handleSummaryChange}
              onTeamSelect={handleTeamSelect}
              owner={owner}
              products={products}
              reviewers={reviewers}
              selectedProducts={selectedProducts}
              summary={formData.summary}
              team={team}
              users={users}
            />
          )}
        </SidePanel.Content>
        <SidePanel.Sticky>
          <SidePanel.Footer className="u-align--right">{renderCurrentFooter()}</SidePanel.Footer>
        </SidePanel.Sticky>
      </SidePanel>

      {successModalOpen && (
        <Modal
          buttonRow={
            <>
              <ActionButton
                appearance="base"
                loading={loading}
                onClick={() => {
                  setSuccessModalOpen(false);
                  onSubmit(true);
                }}
              >
                Save for later
              </ActionButton>
              <ActionButton
                appearance="positive"
                loading={loading}
                onClick={() => {
                  setSuccessModalOpen(false);
                  onSubmit(false);
                }}
              >
                Submit
              </ActionButton>
            </>
          }
          className="p-bug-report-modal"
          close={() => setSuccessModalOpen(false)}
          closeOnOutsideClick={false}
          title="Submit for content review"
        >
          <p>When your copy doc is ready, submit your page request for content review.</p>
          <p>
            If you save for later, you can submit at any time using the button 'Submit for content review' in the top
            right corner of your page view.
          </p>
        </Modal>
      )}
    </>
  );
};

export default NewWebpagePanel;
