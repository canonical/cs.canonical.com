import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { MainTable, Spinner, TablePagination } from "@canonical/react-components";
import { useNavigate } from "react-router-dom";

import ProjectSidebar from "./ProjectSidebar";

import FilterandSearch from "@/components/Views/FilterTableView/FilterandSearch";
import { PageStatus, type IPage } from "@/services/api/types/pages";
import { useProjects } from "@/services/api/hooks/projects";
import { useViewsStore } from "@/store/views";

const STATUS_MAP: Record<string, { label: string; dotClass: string }> = {
  [PageStatus.AVAILABLE]: { label: "Live", dotClass: "full-site-view__status-dot--live" },
  [PageStatus.TO_DELETE]: { label: "To be deleted", dotClass: "full-site-view__status-dot--to-be-deleted" },
  [PageStatus.NEW]: { label: "In progress", dotClass: "full-site-view__status-dot--in-progress" },
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
const DEFAULT_PAGE_SIZE = 30;

const HEADERS = [
  { content: "URL", sortKey: "url" },
  { content: "Title", sortKey: "title" },
  { content: "Owner", sortKey: "owner" },
  { content: "Status", sortKey: "status" },
];

const FullSiteView = (): ReactNode => {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const activeProject = useViewsStore((state) => state.activeProject);
  const filter = useViewsStore((state) => state.filter);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Find the selected project data
  const projectData = useMemo(
    () => projects?.find((p) => p.name === activeProject),
    [projects, activeProject],
  );

  // Flatten all pages from the selected project
  const flatPages = useMemo(() => {
    if (!projectData?.templates) return [];
    return flattenPages(projectData.templates);
  }, [projectData]);

  // Reset to page 1 when project, filters, or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeProject, filter, pageSize]);

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

  // Build MainTable rows from paginated pages
  const rows = paginatedPages.map((page) => {
    const status = STATUS_MAP[page.status] || { label: page.status, dotClass: "" };
    const ownerName = page.owner?.name === "Default" || !page.owner?.email ? "" : page.owner?.name;

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
          content: (
            <button
              className="p-button--link u-no-margin--bottom u-no-padding u-align-text--left"
              onClick={() => onPageSelect(page)}
            >
              {page.url || "/"} <i className="p-icon--external-link" />
            </button>
          ),
        },
        { content: page.title || "" },
        { content: ownerName },
        {
          content: (
            <span className="full-site-view__status">
              <span className={`full-site-view__status-dot ${status.dotClass}`} />
              {status.label}
            </span>
          ),
        },
      ],
    };
  });

  // Format project name for header (e.g. "canonical.com" -> "Canonical.com")
  const projectDisplayName = activeProject
    ? activeProject.charAt(0).toUpperCase() + activeProject.slice(1)
    : "";

  return (
    <div className="full-site-view">
      <ProjectSidebar />
      <div className="full-site-view__content">
        <h2>{projectDisplayName} pages</h2>

        <div className="p-segmented-control">
          <div className="p-segmented-control__list" role="tablist">
            <button
              aria-selected="true"
              className="p-segmented-control__button"
              role="tab"
              type="button"
            >
              List view
            </button>
            <button
              aria-selected="false"
              className="p-segmented-control__button"
              role="tab"
              type="button"
              disabled
            >
              Tree view
            </button>
          </div>
        </div>

        <FilterandSearch />
        <hr className="p-rule" />

        {isLoading && <Spinner text="Loading projects. Please wait." />}

        {!isLoading && (
          <>
            <MainTable
              emptyStateMsg="No pages found."
              headers={HEADERS}
              rows={rows}
              sortable
            />
            {flatPages.length > pageSize && (
              <TablePagination
                currentPage={currentPage}
                data={paginatedPages}
                externallyControlled
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageLimits={PAGE_SIZE_OPTIONS}
                pageSize={pageSize}
                totalItems={flatPages.length}
              />
            )}
            {flatPages.length > 0 && (
              <p className="u-text--muted">
                Showing {paginatedPages.length} out of {flatPages.length} pages
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FullSiteView;
