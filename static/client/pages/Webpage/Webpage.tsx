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
import { PageStatus } from "@/services/api/types/pages";
import { usePanelsStore } from "@/store/app";

const Webpage = ({ page, project }: IWebpageProps): ReactNode => {
  const toggleProductsPanel = usePanelsStore((state) => state.toggleProductsPanel);
  const isNew = useMemo(() => page.status === PageStatus.NEW, [page.status]);
  const pageName = useMemo(() => page.name.split("/").reverse()[0], [page.name]);

  return (
    <>
      <div className="l-webpage">
        <div className="l-webpage__header grid-row--50-50">
          <div className="grid-col">
            <Breadcrumbs />
          </div>
          <div className="grid-col">
            <WebpageActions page={page} />
          </div>
        </div>

        {isNew ? (
          <h1 aria-labelledby="page-title" className="u-no-padding--top p-heading--4">
            New page: {pageName}
          </h1>
        ) : (
          <h1 aria-labelledby="page-title" className="u-no-padding--top p-heading--4">
            {page.title || "No title"}
            {page.status === PageStatus.TO_DELETE && (
              <Chip
                appearance="negative"
                iconName="delete"
                isInline
                style={{ marginLeft: "8px" }}
                value="Scheduled for removal"
              />
            )}
          </h1>
        )}

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
            <WebpageDetails page={page} project={project} />
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
