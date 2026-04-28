import { useMemo, type ReactNode } from "react";

import { Button, Chip } from "@canonical/react-components";

import { type IWebpageProps } from "./Webpage.types";

import Breadcrumbs from "@/components/Breadcrumbs";
import EditProductPanel from "@/components/EditProductPanel/EditProductPanel";
import JiraTasks from "@/components/JiraTasks";
import WebpageActions from "@/components/Webpage/WebpageActions";
import WebpageDetails from "@/components/Webpage/WebpageDetails";
import WebpageStats from "@/components/Webpage/WebpageStats";
import WebpageAssets from "@/components/WebpageAssets";
import { BACKLOG, IN_DESIGN, IN_REVIEW, UNTRIAGED } from "@/config";
import type { IPage } from "@/services/api/types/pages";
import { PageStatus } from "@/services/api/types/pages";
import { usePanelsStore } from "@/store/app";

function getContentReviewTask(page: IPage) {
  // For a brand new page, the very first jira task is the content review task
  let task = page.jira_tasks[0];
  return task;
}

const Webpage = ({ page, project }: IWebpageProps): ReactNode => {
  const toggleProductsPanel = usePanelsStore((state) => state.toggleProductsPanel);
  const isNew = useMemo(() => page.status === PageStatus.NEW, [page.status]);
  const pageName = useMemo(() => {
    if (isNew) return `New page: ${page.name.split("/").reverse()[0]}`;
    return page.title || "No title";
  }, [isNew, page.name, page.title]);

  const contentReviewTask = useMemo(() => getContentReviewTask(page), [page]);

  const isPendingContentReview = useMemo(
    () => !!contentReviewTask && [IN_DESIGN, IN_REVIEW].includes(contentReviewTask.status.toLowerCase()),
    [contentReviewTask],
  );

  const requiresContentReviewSubmission = useMemo(() => {
    if (page.status === PageStatus.NEW && !page.content_jira_id) {
      if (contentReviewTask) {
        return [UNTRIAGED, BACKLOG].includes(contentReviewTask.status.toLowerCase());
      }
    }

    return false;
  }, [contentReviewTask, page.content_jira_id, page.status]);

  function getPageChips() {
    const chips = [] as ReactNode[];
    if (page.status === PageStatus.TO_DELETE) {
      chips.push(
        <Chip
          appearance="negative"
          iconName="delete"
          isInline
          style={{ marginLeft: "8px" }}
          value="Scheduled for removal"
        />,
      );
      return chips;
    }

    const pageTasks = page.jira_tasks || [];
    if (!pageTasks.length) return chips;

    if (page.status === PageStatus.NEW) {
      const contentReviewTask = getContentReviewTask(page);
      if (!contentReviewTask) return chips;

      if (contentReviewTask.status.toLowerCase() === UNTRIAGED) {
        chips.push(
          <Chip appearance="caution" iconName="file-blank" isInline style={{ marginLeft: "8px" }} value="Draft" />,
        );
      } else if ([IN_REVIEW, IN_DESIGN].includes(contentReviewTask.status.toLowerCase())) {
        chips.push(
          <Chip
            appearance="information"
            iconName="revisions"
            isInline
            style={{ marginLeft: "8px" }}
            value="In review"
          />,
        );
      }

      return chips;
    }
  }

  return (
    <>
      <div className="l-webpage">
        <div className="l-webpage__header grid-row--50-50">
          <div className="grid-col">
            <Breadcrumbs />
          </div>
          <div className="grid-col">
            <WebpageActions
              contentReviewTask={contentReviewTask}
              isPendingContentReview={isPendingContentReview}
              page={page}
              requiresContentReviewSubmission={requiresContentReviewSubmission}
            />
          </div>
        </div>

        <h1 aria-labelledby="page-title" className="u-no-padding--top p-heading--4">
          {pageName}
          {getPageChips()}
        </h1>

        <section className="l-webpage__section">
          <h2 className="p-text--small-caps">Tags</h2>
          <div className="l-webpage__tags">
            {page.products.map((p) => {
              return <Chip isReadOnly={true} key={p.id} value={p.name} />;
            })}
            <Button appearance="base" onClick={toggleProductsPanel} small>
              Edit tags
            </Button>
          </div>
        </section>

        <hr className="p-rule" />

        <div className="grid-row--50-50-on-large p-divider">
          <div className="grid-col p-divider__block">
            <WebpageDetails
              editDetailsDisabled={isPendingContentReview}
              editDetailsDisabledTooltip={
                isPendingContentReview ? (
                  <span>
                    The ticket is pending content review. <br />
                    You can follow our progress on Jira or in your requests.
                  </span>
                ) : (
                  ""
                )
              }
              page={page}
              project={project}
            />
          </div>
          {!isNew && (
            <div className="grid-col p-divider__block">
              <WebpageStats project={project} url={page.url as string} />
            </div>
          )}
        </div>

        <WebpageAssets projectName={page.project?.name} url={page.url} />

        <div className="l-webpage__tasks grid-row">
          <hr className="p-rule" />
          <h2 className="p-text--small-caps">Related Jira Tickets</h2>
          <JiraTasks isWebPage={true} tasks={page.jira_tasks} />
        </div>

        <EditProductPanel page={page} />
      </div>
    </>
  );
};

export default Webpage;
