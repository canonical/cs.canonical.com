import React, { useEffect, useMemo, useState, useCallback } from "react";

import {
  ScrollableTable,
  MainTable,
  TablePagination,
  Icon,
  ContextualMenu,
  Spinner,
} from "@canonical/react-components";
import { useNavigate } from "react-router-dom";

import RequestCopydocPanel from "@/components/RequestCopydocPanel/RequestCopydocPanel";
import RequestRemovalPanel from "@/components/RequestRemovalPanel";
import RequestTaskModal from "@/components/RequestTaskModal/RequestTaskModal";
import { VIEW_OWNED } from "@/config";
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

const HEADERS = [
  { content: "URL", sortKey: "url" },
  { content: "Title", sortKey: "title" },
  { content: "Status", sortKey: "status" },
  { content: "Actions", className: "u-align-text--center" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30];
const DEFAULT_PAGE_SIZE = 10;

const NOOP_SORT = (): 0 | 1 | -1 => 0;

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

const Owned: React.FC = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);

  const [setView, setFilter] = useViewsStore((state) => [state.setView, state.setFilter]);
  const filter = useViewsStore((state) => state.filter);

  const { data: projects, isLoading } = useProjects();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedPage, setSelectedPage] = useState<IPage | null>(null);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string }>({
    key: "none",
    direction: "none",
  });

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

    const allPages = projects.flatMap((project) => (project.templates ? flattenPages(project.templates) : []));

    // TO UNCOMMENT AFTER REVIEW: Filter pages by the current user's email
    // return allPages.filter((page) => page.owner?.email === user?.email);

    return allPages;
  }, [projects]);

  const sortedPages = useMemo(() => {
    if (sortConfig.key === "none" || sortConfig.direction === "none") {
      return displayPages;
    }

    return [...displayPages].sort((a, b) => {
      let aValue = "";
      let bValue = "";

      switch (sortConfig.key) {
        case "title":
          aValue = (a.title || "").toLowerCase();
          bValue = (b.title || "").toLowerCase();
          break;
        case "status":
          aValue = (STATUS_MAP[a.status]?.label || a.status || "").toLowerCase();
          bValue = (STATUS_MAP[b.status]?.label || b.status || "").toLowerCase();
          break;
        case "url":
        default:
          aValue = (a.url || "").toLowerCase();
          bValue = (b.url || "").toLowerCase();
          break;
      }

      const modifier = sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue < bValue) return modifier;
      if (aValue > bValue) return -modifier;

      const aUrl = (a.url || "").toLowerCase();
      const bUrl = (b.url || "").toLowerCase();
      if (aUrl < bUrl) return -1;
      if (aUrl > bUrl) return 1;

      return 0;
    });
  }, [displayPages, sortConfig]);

  const paginatedPages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPages.slice(start, start + pageSize);
  }, [sortedPages, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sortConfig]);

  const onPageSelect = useCallback(
    (page: IPage) => {
      navigate(`/app/webpage/${page.project?.name}${page.url}`);
    },
    [navigate],
  );

  const handleUpdateSort = useCallback((sortKey: string | null | undefined) => {
    if (!sortKey) {
      setSortConfig({ key: "none", direction: "none" });
      return;
    }
    setSortConfig((prevConfig) => ({
      key: sortKey,
      direction: prevConfig.key === sortKey && prevConfig.direction === "ascending" ? "descending" : "ascending",
    }));
  }, []);

  const onPageSizeChange = useCallback((newPageSize: number) => {
    setCurrentPage(1);
    setPageSize(newPageSize);
  }, []);

  const rows = useMemo(() => {
    return paginatedPages.map((page) => {
      const status = STATUS_MAP[page.status] || { label: page.status, dotClass: "" };
      const ownerName = page.owner?.name === "Default" || !page.owner?.email ? "" : page.owner?.name;
      const displayedTitle = page.title?.startsWith("{{") ? "-" : page.title || "";

      const isNew = page.status === PageStatus.NEW;
      const hasJiraTasks = !!page.jira_tasks?.length;
      const isContentBoardPage = !!page.content_jira_id;
      const isMenuDisabled = isNew && (hasJiraTasks || isContentBoardPage);
      const allActionsDisabled = page.status === PageStatus.TO_DELETE;

      let links: any[] = [];
      if (!isNew) {
        links = [
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
      } else if (!hasJiraTasks && !isContentBoardPage) {
        links = [
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
                  links={links}
                  position="left"
                  toggleDisabled={isMenuDisabled}
                  toggleLabel={<Icon name="contextual-menu" />}
                  toggleProps={{ "aria-label": "Toggle menu" }}
                />
              </div>
            ),
          },
        ],
      };
    });
  }, [
    paginatedPages,
    onPageSelect,
    toggleCopyUpdatePanel,
    toggleRequestRemovalPanel,
    setModalOpen,
    setSelectedChangeType,
  ]);

  useEffect(() => {
    setView(VIEW_OWNED);
    setFilter({ owners: [], reviewers: [], products: [], query: "" });
    return () => setFilter({ owners: [], reviewers: [], products: [], query: "" });
  }, [setFilter, setView]);

  return (
    <div className="l-owned">
      <div>
        <h4>Your pages</h4>
        {isLoading && <Spinner text="Loading pages. Please wait." />}

        {!isLoading && (
          <ScrollableTable belowIds={["owned-pages-pagination"]} dependencies={[rows]} tableId="owned-pages-table">
            <MainTable
              emptyStateMsg="No pages found."
              headers={HEADERS}
              id="owned-pages-table"
              onUpdateSort={handleUpdateSort}
              rows={rows}
              sortFunction={NOOP_SORT}
              sortable
            />
          </ScrollableTable>
        )}
      </div>

      {!isLoading && (
        <div className="l-owned__pagination" id="owned-pages-pagination">
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
