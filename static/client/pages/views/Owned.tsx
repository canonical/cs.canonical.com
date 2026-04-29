import React, { useEffect, useMemo, useState, useCallback } from "react";
import { VIEW_OWNED } from "@/config";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";
import { useViewsStore } from "@/store/views";
import { MainTable, TablePagination, Icon, ContextualMenu, Spinner } from "@canonical/react-components";
import { ChangeRequestType, PageStatus, type IPage } from "@/services/api/types/pages";
import { useProjects } from "@/services/api/hooks/projects";
import { useNavigate } from "react-router-dom";

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

// Updated headers for MainTable
const HEADERS = [
  { content: "URL", sortKey: "url" },
  { content: "Title", sortKey: "title" },
  { content: "Status", sortKey: "status" },
  { content: "Actions" }, // Typically no sortKey for actions
];

const PAGE_SIZE_OPTIONS = [10, 20, 30];
const DEFAULT_PAGE_SIZE = 10;

const Owned: React.FC = () => {
  const navigate = useNavigate();
  const [setView, setFilter] = useViewsStore((state) => [state.setView, state.setFilter]);
  const user = useStore((state) => state.user);
  const filter = useViewsStore((state) => state.filter);

  const { data: projects, isLoading } = useProjects();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedPage, setSelectedPage] = useState<IPage | null>(null);

  const [selectedChangeType, setSelectedChangeType] = useState<
    (typeof ChangeRequestType)[keyof typeof ChangeRequestType]
  >(ChangeRequestType.COPY_UPDATE);
  const [modalOpen, setModalOpen] = useState(false);

  const [copyUpdatePanelVisible, toggleCopyUpdatePanel, toggleRequestRemovalPanel] = usePanelsStore((state) => [
    state.copyUpdatePanelVisible,
    state.toggleCopyUpdatePanel,
    state.toggleRequestRemovalPanel,
  ]);

  // HARDCODED EMAIL FOR TESTING:
  // Change this to the email address that actually owns pages in your database.
  const TEST_EMAIL = "test.user@canonical.com";

  // Flatten pages from ALL projects and filter by the test email (instead of user.email)
  const ownedPages = useMemo(() => {
    if (!projects) return [];

    const allPages = projects.flatMap((project) => (project.templates ? flattenPages(project.templates) : []));

    // Keep only the pages owned by the target test email
    return allPages.filter((page) => page.owner?.email === TEST_EMAIL);
  }, [projects, TEST_EMAIL]);

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
  }, [filter]);

  // Paginate
  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return ownedPages.slice(start, start + pageSize);
  }, [ownedPages, currentPage, pageSize]);

  const onPageSelect = useCallback(
    (page: IPage) => {
      navigate(`/app/webpage/${page.project?.name}${page.url}`);
    },
    [navigate],
  );

  const isMenuDisabled = (page: IPage) => {
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
              <i className="p-icon--file" /> <span>Copy update</span>
            </>
          ),
          disabled: allActionsDisabled,
          onClick: () => {
            setSelectedPage(page);
            toggleCopyUpdatePanel();
          },
        },
        {
          children: (
            <>
              <i className="p-icon--change-version" /> <span>Page refresh</span>
            </>
          ),
          disabled: allActionsDisabled,
          onClick: () => {
            setSelectedPage(page);
            setSelectedChangeType(ChangeRequestType.PAGE_REFRESH);
            setModalOpen(true);
          },
        },
        {
          children: (
            <>
              <i className="p-icon--delete" /> <span>Remove page</span>
            </>
          ),
          disabled: allActionsDisabled,
          onClick: () => {
            setSelectedPage(page);
            toggleRequestRemovalPanel();
          },
        },
      ];
    }

    if (!hasJiraTasks && !isContentBoardPage) {
      return [
        {
          children: (
            <>
              <i className="p-icon--file" /> <span>Submit for content review</span>
            </>
          ),
          onClick: () => {
            setSelectedPage(page);
            setSelectedChangeType(ChangeRequestType.NEW_WEBPAGE);
            setModalOpen(true);
          },
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
              <ContextualMenu
                links={getMenuLinks(page)}
                position="left"
                toggleDisabled={isMenuDisabled(page)}
                toggleLabel={<Icon name="contextual-menu" />}
                toggleProps={{ "aria-label": "Toggle menu" }}
              />
            </div>
          ),
        },
      ],
    };
  });

  const onPageSizeChange = (newPageSize: number) => {
    setCurrentPage(1);
    setPageSize(newPageSize);
  };

  useEffect(() => {
    setView(VIEW_OWNED);
    // Be sure to revert TEST_EMAIL back to user.email when you are done testing
    setFilter({
      owners: [TEST_EMAIL],
      reviewers: [],
      products: [],
      query: "",
    });
    return () => {
      setFilter({
        owners: [],
        reviewers: [],
        products: [],
        query: "",
      });
    };
  }, [setFilter, setView, TEST_EMAIL]);

  return (
    <div className="l-owned">
      {/* Table Section: Will grow to fill space if .l-owned has flex: 1 and display: flex */}
      <div>
        <h4>Your pages</h4>
        {isLoading && <Spinner text="Loading pages. Please wait." />}

        {!isLoading && <MainTable emptyStateMsg="No pages found." headers={HEADERS} rows={rows} sortable />}
      </div>

      {/* Pagination Section: Will sit at the bottom if .l-owned__pagination has margin-top: auto */}
      {!isLoading && (
        <div className="l-owned__pagination">
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
            totalItems={ownedPages.length}
          />
        </div>
      )}
    </div>
  );
};

export default Owned;
