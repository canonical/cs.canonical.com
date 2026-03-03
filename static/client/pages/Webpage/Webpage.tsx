import { useCallback, useMemo, type ReactNode } from "react";

import { Button, Chip } from "@canonical/react-components";

import { type IWebpageProps } from "./Webpage.types";

import Breadcrumbs from "@/components/Breadcrumbs";
import IconTextWithTooltip from "@/components/Common/IconTextWithTooltip";
import EditProductPanel from "@/components/EditProductPanel/EditProductPanel";
import JiraTasks from "@/components/JiraTasks";
import WebpageActions from "@/components/Webpage/WebpageActions";
import WebpageAssets from "@/components/WebpageAssets";
import config from "@/config";
import { PageStatus } from "@/services/api/types/pages";
import { usePanelsStore } from "@/store/app";

const Webpage = ({ page, project }: IWebpageProps): ReactNode => {
  const toggleProductsPanel = usePanelsStore((state) => state.toggleProductsPanel);

  const openCopyDoc = useCallback(() => {
    window.open(page.copy_doc_link);
  }, [page]);

  const pageExtension = useMemo(() => {
    return page.ext || ".html";
  }, [page.ext]);

  const openGitHub = useCallback(() => {
    if (page.children?.length) {
      window.open(`${config.ghLink(project)}${page.name}/index${pageExtension}`);
    } else {
      window.open(`${config.ghLink(project)}${page.name}${pageExtension}`);
    }
  }, [page.children?.length, page.name, pageExtension, project]);

  const openFigma = useCallback(() => {
    window.open(page.figma_link);
  }, [page]);

  const isNew = useMemo(() => page.status === PageStatus.NEW, [page]);
  const pageName = useMemo(() => page.name.split("/").reverse()[0], [page]);

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
          <h1>New page: {pageName}</h1>
        ) : (
          <h4 aria-labelledby="page-title" className="u-no-padding--top">
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
          </h4>
        )}

        <section className="l-webpage__section">
          <p className="p-text--small-caps">Tags</p>
          <div className="l-webpage__tags">
            {page.products.map((p) => {
              return <Chip key={p.id} value={p.name} />;
            })}
            <Button appearance="base" onClick={toggleProductsPanel} small>
              Edit tags
            </Button>
          </div>
        </section>

        <hr className="p-rule" />

        <div className="grid-row--50-50">
          <div className="grid-col">
            <div className="l-webpage__details-header">
              <p className="p-text--small-caps">Page Details</p>
              <Button appearance="base" hasIcon>
                <i className="p-icon--edit" />
              </Button>
            </div>
            <div className="l-webpage__details">
              <div className="label u-text--muted">Published page</div>
              <div className="value">
                <a href={`https://${project}${page.url}`} rel="noopener noreferrer" target="_blank">
                  View live page <i className="p-icon--external-link" />
                </a>
              </div>

              <div className="label u-text--muted">
                <IconTextWithTooltip icon="information" message={config.tooltips.ownerDef} text="Owner" />
              </div>
              <div className="value">{page.owner.name}</div>

              <div className="label u-text--muted">
                <IconTextWithTooltip icon="information" message={config.tooltips.reviewerDef} text="Contributors" />
              </div>
              <div className="value">{page.reviewers.map((r) => r.name).join(", ")}</div>

              <div className="label u-text--muted">Related links</div>
              <div className="value">
                <ul className="p-inline-list--middot">
                  {page.copy_doc_link && (
                    <li className="p-inline-list__item">
                      <Button appearance="link" className="u-no-margin--bottom" onClick={openCopyDoc}>
                        Copy doc <i className="p-icon--external-link" />
                      </Button>
                    </li>
                  )}
                  <li className="p-inline-list__item">
                    <Button appearance="link" className="u-no-margin--bottom" onClick={openGitHub}>
                      Github <i className="p-icon--external-link" />
                    </Button>
                  </li>
                  {page.figma_link && (
                    <li className="p-inline-list__item">
                      <Button appearance="link" className="u-no-margin--bottom" onClick={openFigma}>
                        Figma <i className="p-icon--external-link" />
                      </Button>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <hr className="p-rule" />

        <WebpageAssets projectName={page.project?.name} url={page.url} />

        <div className="l-webpage__tasks grid-row">
          <p className="p-text--small-caps">Related Jira Tickets</p>
          <JiraTasks isWebPage={true} tasks={page.jira_tasks} />
        </div>

        <EditProductPanel />
      </div>
    </>
  );
};

export default Webpage;
