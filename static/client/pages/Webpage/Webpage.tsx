import { useCallback, useMemo, useState, type ReactNode } from "react";

import { Button } from "@canonical/react-components";

import { type IWebpageProps } from "./Webpage.types";

import Breadcrumbs from "@/components/Breadcrumbs";
import EditProductPanel from "@/components/EditProductPanel/EditProductPanel";
import JiraTasks from "@/components/JiraTasks";
import OwnerAndReviewers from "@/components/OwnerAndReviewers";
import Products from "@/components/Products";
import RequestTaskModal from "@/components/RequestTaskModal";
import WebpageAssets from "@/components/WebpageAssets";
import config from "@/config";
import { ChangeRequestType, PageStatus } from "@/services/api/types/pages";
import { useStore } from "@/store";

const Webpage = ({ page, project }: IWebpageProps): ReactNode => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editProductPanelOpen, setEditProductPanelOpen] = useState(false);
  const [changeType, setChangeType] = useState<(typeof ChangeRequestType)[keyof typeof ChangeRequestType]>(
    ChangeRequestType.COPY_UPDATE,
  );
  const [user] = useStore((state) => [state.user]);

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

  const createNewPage = useCallback(() => {
    setChangeType(ChangeRequestType.NEW_WEBPAGE);
    setModalOpen(true);
  }, []);

  const requestChanges = useCallback(() => {
    setChangeType(ChangeRequestType.COPY_UPDATE);
    setModalOpen(true);
  }, []);

  const requestRemoval = useCallback(() => {
    setChangeType(ChangeRequestType.PAGE_REMOVAL);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const toggleEditProductPanelClose = useCallback(() => {
    setEditProductPanelOpen((x) => !x);
  }, []);

  const isNew = useMemo(() => page.status === PageStatus.NEW, [page]);
  const pageName = useMemo(() => page.name.split("/").reverse()[0], [page]);
  const hasJiraTasks = useMemo(() => page.jira_tasks?.length, [page]);

  // A page which was created from the content team's board on Jira
  // must have a valid content_jira_id
  const isContentBoardPage = useMemo(() => page.content_jira_id, [page]);

  return (
    <>
      <div className="l-webpage">
        <div className="p-section--shallow">
          <Breadcrumbs />
        </div>

        {isNew ? (
          <h1>New page: {pageName}</h1>
        ) : (
          <>
            <h1 aria-labelledby="page-title" className="u-no-padding--top">
              {page.title || "No title"}
            </h1>
          </>
        )}
        <div>
          {isNew ? (
            <p>{`${project}${page.name}`}</p>
          ) : (
            <a href={`https://${project}${page.name}`} rel="noopener noreferrer" target="_blank">
              {`${project}${page.name}`}&nbsp;
              <i className="p-icon--external-link" />
            </a>
          )}
        </div>
        <div className="l-webpage--buttons">
          <>
            {isNew && !hasJiraTasks && !isContentBoardPage && (
              <Button appearance="positive" onClick={createNewPage}>
                Submit for publication...
              </Button>
            )}
            {!isNew && (
              <Button appearance="positive" onClick={requestChanges}>
                Request changes
              </Button>
            )}
            {page.copy_doc_link && (
              <Button appearance="neutral" onClick={openCopyDoc}>
                Edit copy doc&nbsp;
                <i className="p-icon--external-link" />
              </Button>
            )}
            {!isNew && (
              <Button appearance="neutral" onClick={openGitHub}>
                Inspect code on GitHub&nbsp;
                <i className="p-icon--external-link" />
              </Button>
            )}
            <Button appearance="neutral" onClick={requestRemoval}>
              Request removal
            </Button>
          </>
        </div>
        <div className={isNew ? "grid-row" : "grid-row--50-50"}>
          {!isNew && (
            <div className="grid-col">
              <p className="p-text--small-caps" id="page-descr">
                Description
              </p>
              <p aria-labelledby="page-descr">{page.description || "-"}</p>
            </div>
          )}
          <div className="grid-col">
            <OwnerAndReviewers page={page} />
            <div className="u-sv3" />
            <Products page={page} />
            {user.role === "admin" ? (
              <Button appearance="link" onClick={toggleEditProductPanelClose}>
                Edit product tags
              </Button>
            ) : (
              <p>To edit product tags, please contact the Sites team.</p>
            )}
          </div>
        </div>
        {page.jira_tasks?.length ? (
          <div className="l-webpage--tasks grid-row">
            <p className="p-text--small-caps">Related Jira Tickets</p>
            <JiraTasks tasks={page.jira_tasks} />
          </div>
        ) : null}
        <WebpageAssets page={page} />
        {modalOpen && (
          <RequestTaskModal
            changeType={changeType}
            copyDocLink={page.copy_doc_link}
            onClose={handleModalClose}
            onTypeChange={setChangeType}
            webpage={page}
          />
        )}
        <EditProductPanel isOpen={editProductPanelOpen} onClose={toggleEditProductPanelClose} />
      </div>
    </>
  );
};

export default Webpage;
