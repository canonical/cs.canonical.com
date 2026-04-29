import React, { useEffect, useMemo, useState, useCallback } from "react";
import { VIEW_OWNED } from "@/config";
import { useStore } from "@/store";
import { usePanelsStore } from "@/store/app";
import { useViewsStore } from "@/store/views";
import { MainTable, TablePagination, Icon, ContextualMenu, Spinner } from "@canonical/react-components";
import { ChangeRequestType, PageStatus, type IPage } from "@/services/api/types/pages";
import { useProjects } from "@/services/api/hooks/projects";
import { useNavigate } from "react-router-dom";

import RequestCopydocPanel from "@/components/RequestCopydocPanel/RequestCopydocPanel";
import RequestRemovalPanel from "@/components/RequestRemovalPanel";
import RequestTaskModal from "@/components/RequestTaskModal/RequestTaskModal";

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

const HEADERS = [
  { content: "URL", sortKey: "url", style: { width: "23.6%" } },
  { content: "Title", sortKey: "title", style: { width: "48.8%" } },
  { content: "Status", sortKey: "status", style: { width: "17.3%" } },
  { content: "Actions", style: { width: "10.3%" }, className: "u-align-text--center" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30];
const DEFAULT_PAGE_SIZE = 10;

const Owned: React.FC = () => {
  const navigate = useNavigate();
  const [setView, setFilter] = useViewsStore((state) => [state.setView, state.setFilter]);
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

  const displayPages = useMemo(() => {
    if (!projects) return [];

    return projects.flatMap((project) => (project.templates ? flattenPages(project.templates) : []));
  }, [projects]);

  useEffect(() => {
    setCurrentPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
  }, [filter]);

  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayPages.slice(start, start + pageSize);
  }, [displayPages, currentPage, pageSize]);

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
          className: "l-owned__cell--wrap-anywhere",
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
          className: "l-owned__cell--truncate",
          content: <span title={displayedTitle}>{displayedTitle}</span>,
        },
        {
          content: (
            <span className="l-owned__status">
              <Icon name={status.dotClass} />
              <span className="l-owned-status">{status.label}</span>
            </span>
          ),
        },
        {
          content: (
            <div className="u-align-text--center l-owned__actions">
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
    setFilter({
      owners: [],
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
  }, [setFilter, setView]);

  return (
    <div className="l-owned">
      <div>
        <h4>Your pages</h4>
        {isLoading && <Spinner text="Loading pages. Please wait." />}

        {!isLoading && <MainTable emptyStateMsg="No pages found." headers={HEADERS} rows={rows} sortable />}
      </div>

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
            totalItems={displayPages.length}
          />
        </div>
      )}

      {copyUpdatePanelVisible && selectedPage && (
        <RequestCopydocPanel isOpen={copyUpdatePanelVisible} onClose={toggleCopyUpdatePanel} webpage={selectedPage} />
      )}
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

export default Owned;
