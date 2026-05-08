import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { ContextualMenu, Icon, MainTable, Spinner, TablePagination, Tooltip } from "@canonical/react-components";
import { useNavigate } from "react-router-dom";

import ProjectSidebar from "./ProjectSidebar";

import RequestCopydocPanel from "@/components/RequestCopydocPanel/RequestCopydocPanel";
import RequestRemovalPanel from "@/components/RequestRemovalPanel";
import RequestTaskModal from "@/components/RequestTaskModal/RequestTaskModal";
import FilterandSearch from "@/components/Views/FilterTableView/FilterandSearch";
import { canActOnPage } from "@/helpers/permissions";
import { useProjects } from "@/services/api/hooks/projects";
import { ChangeRequestType, PageStatus, type IPage } from "@/services/api/types/pages";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";
import { useViewsStore } from "@/store/views";

const STATUS_MAP: Record<string, { label: string; dotClass: string }> = {
  [PageStatus.AVAILABLE]: { label: "Live", dotClass: "status-succeeded-small" },
  [PageStatus.TO_DELETE]: { label: "To be deleted", dotClass: "status-failed-small" },
  [PageStatus.NEW]: { label: "In progress", dotClass: "status-waiting-small" },
};

function flattenPages(page: IPage, skipDirs: boolean = true): IPage[] {
  const result: IPage[] = [];
  if (!(skipDirs && page.ext === ".dir")) {
    result.push(page);
  }
  for (const child of page.children || []) {
    result.push(...flattenPages(child, skipDirs));
  }
  return result;
}

const PAGE_SIZE_OPTIONS = [10, 20, 30];
const DEFAULT_PAGE_SIZE = 10;

const HEADERS = [
  { content: "URL", sortKey: "url", style: { width: "23.5%" } },
  { content: "Title", sortKey: "title", style: { width: "23.5%" } },
  { content: "Owner", sortKey: "owner", style: { width: "23.5%" } },
  { content: "Status", sortKey: "status", style: { width: "17%" } },
  { content: "Actions", sortKey: "action", style: { width: "12%" }, className: "u-align-text--center" },
];

const FullSiteView = (): ReactNode => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const user = useStore((state) => state.user);
  const activeProject = useViewsStore((state) => state.activeProject);
  const filter = useViewsStore((state) => state.filter);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedPage, setSelectedPage] = useState<IPage | null>(null);
  const [selectedChangeType, setSelectedChangeType] = useState<
    (typeof ChangeRequestType)[keyof typeof ChangeRequestType]
  >(ChangeRequestType.COPY_UPDATE);
  const [modalOpen, setModalOpen] = useState(false);

  const [toggleCopyUpdatePanel, toggleRequestRemovalPanel] = usePanelsStore((state) => [
    state.toggleCopyUpdatePanel,
    state.toggleRequestRemovalPanel,
  ]);

  // Find the selected project data
  const projectData = useMemo(() => projects?.find((p) => p.name === activeProject), [projects, activeProject]);

  // Flatten all pages from the selected project
  const flatPages = useMemo(() => {
    if (!projectData?.templates) return [];
    return flattenPages(projectData.templates);
  }, [projectData]);

  // Reset to page 1 when project, filters, or page size change
  useEffect(() => {
    setCurrentPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
  }, [activeProject, filter]);

  // Paginate
  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return flatPages.slice(start, start + pageSize);
  }, [flatPages, currentPage, pageSize]);

  const onPageSelect = useCallback(
    (page: IPage) => {
      navigate(`/app/webpage/${page.project?.name}${page.url}`);
    },
    [navigate],
  );

  const isMenuDisabled = (page: IPage) => {
    if (!canActOnPage(user, page)) return true;
    const isNew = page.status === PageStatus.NEW;
    const hasJiraTasks = !!page.jira_tasks?.length;
    const isContentBoardPage = !!page.content_jira_id;
    return isNew && (hasJiraTasks || isContentBoardPage);
  };

  const getMenuLinks = (page: IPage) => {
    const isNew = page.status === PageStatus.NEW;
    const hasJiraTasks = !!page.jira_tasks?.length;
    const isContentBoardPage = !!page.content_jira_id;
    const allActionsDisabled = page.status === PageStatus.TO_DELETE;

    if (!isNew) {
      return [
        {
          children: (
            <>
              <Icon name="file" /> <span>Copy update</span>
            </>
          ),
          disabled: allActionsDisabled,
          onClick: () => {
            setSelectedPage(page);
            toggleCopyUpdatePanel();
          },
          className: "full-site-view__actions-menu-link",
        },
        {
          children: (
            <>
              <Icon name="change-version" /> <span>Page refresh</span>
            </>
          ),
          disabled: allActionsDisabled,
          onClick: () => {
            setSelectedPage(page);
            setSelectedChangeType(ChangeRequestType.PAGE_REFRESH);
            setModalOpen(true);
          },
          className: "full-site-view__actions-menu-link",
        },
        {
          children: (
            <>
              <Icon name="delete" /> <span>Remove page</span>
            </>
          ),
          disabled: allActionsDisabled,
          onClick: () => {
            setSelectedPage(page);
            toggleRequestRemovalPanel();
          },
          className: "full-site-view__actions-menu-link",
        },
      ];
    }

    if (!hasJiraTasks && !isContentBoardPage) {
      return [
        {
          children: (
            <>
              <Icon name="file" /> <span>Submit for content review</span>
            </>
          ),
          onClick: () => {
            setSelectedPage(page);
            setSelectedChangeType(ChangeRequestType.NEW_WEBPAGE);
            setModalOpen(true);
          },
          className: "full-site-view__actions-menu-link",
        },
      ];
    }

    return [];
  };

  // Build MainTable rows from paginated pages
  const rows = paginatedPages.map((page) => {
    const status = STATUS_MAP[page.status] || { label: page.status, dotClass: "" };
    const ownerName = page.owner?.name === "Default" || !page.owner?.email ? "" : page.owner?.name;
    const displayedTitle = page.title?.startsWith("{{") ? "-" : page.title || "";

    return {
      key: `${page.project?.name}${page.url}`,
      sortData: {
        url: page.url || "",
        title: page.title || "",
        owner: ownerName,
        status: status.label,
      },
      columns: [
        {
          className: "full-site-view__cell--wrap-anywhere",
          content: (
            <button
              className="p-button--link u-no-margin--bottom u-no-padding u-align-text--left"
              onClick={() => onPageSelect(page)}
            >
              {page.url || "/"} <i className="p-icon--external-link" />
            </button>
          ),
        },
        {
          className: "full-site-view__cell--truncate",
          content: <span title={displayedTitle}>{displayedTitle}</span>,
        },
        { content: ownerName },
        {
          content: (
            <span className="full-site-view__status">
              <Icon name={status.dotClass} />
              {status.label}
            </span>
          ),
        },
        {
          content: (
            <div className="u-align-text--center full-site-view__actions">
              <Tooltip
                message={
                  !canActOnPage(user, page)
                    ? "Only the page owner, contributors, or an admin can perform actions"
                    : undefined
                }
                position="left"
                zIndex={999}
              >
                <ContextualMenu
                  links={getMenuLinks(page)}
                  position="left"
                  toggleDisabled={isMenuDisabled(page)}
                  toggleLabel={<Icon name="contextual-menu" />}
                  toggleProps={{
                    "aria-label": `Page actions for ${page.url}`,
                    className: "u-no-margin p-contextual-menu__toggle",
                  }}
                />
              </Tooltip>
            </div>
          ),
        },
      ],
    };
  });

  // Format project name for header (e.g. "canonical.com" -> "Canonical.com")
  const projectDisplayName = activeProject ? activeProject.charAt(0).toUpperCase() + activeProject.slice(1) : "";

  const onPageSizeChange = (pageSize: number) => {
    setCurrentPage(1);
    setPageSize(pageSize);
  };

  return (
    <div className="full-site-view">
      <ProjectSidebar />
      <div className="full-site-view__content">
        <div>
          <h2 className="p-heading--4">{projectDisplayName} pages</h2>

          <div className="u-sv2">
            <hr className="p-rule" />
          </div>

          <div className="p-segmented-control">
            <div className="p-segmented-control__list" role="tablist">
              <button aria-selected="true" className="p-segmented-control__button" role="tab" type="button">
                List view
              </button>
              <button aria-selected="false" className="p-segmented-control__button" disabled role="tab" type="button">
                Tree view
              </button>
            </div>
          </div>

          <FilterandSearch />

          {isLoading && <Spinner text="Loading projects. Please wait." />}

          {!isLoading && (
            <div className="full-site-view__content-table-wrapper">
              <MainTable emptyStateMsg="No pages found." headers={HEADERS} rows={rows} sortable />
            </div>
          )}
        </div>

        {!isLoading && (
          <div className="full-site-view__content-table-footer">
            <hr className="p-rule" />
            <TablePagination
              className="u-no-margin--top"
              currentPage={currentPage}
              data={paginatedPages}
              externallyControlled
              itemName="page"
              onPageChange={setCurrentPage}
              onPageSizeChange={onPageSizeChange}
              pageLimits={PAGE_SIZE_OPTIONS}
              pageSize={pageSize}
              totalItems={flatPages.length}
            />
          </div>
        )}
      </div>
      {selectedPage && <RequestCopydocPanel webpage={selectedPage} />}
      {modalOpen && selectedPage && (
        <RequestTaskModal
          changeType={selectedChangeType}
          onClose={() => setModalOpen(false)}
          onTypeChange={setSelectedChangeType}
          webpage={selectedPage}
        />
      )}
      <RequestRemovalPanel webpage={selectedPage ?? undefined} />
    </div>
  );
};

export default FullSiteView;
