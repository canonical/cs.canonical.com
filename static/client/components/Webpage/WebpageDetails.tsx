import { Button } from "@canonical/react-components";

import IconTextWithTooltip from "@/components/Common/IconTextWithTooltip";
import EditPageDetailsPanel from "@/components/EditPageDetailsPanel";
import config from "@/config";
import type { IPage } from "@/services/api/types/pages";
import { usePanelsStore } from "@/store/app";

interface IWebpageDetailsProps {
  page: IPage;
  project: string;
}

const WebpageDetails = ({ page, project }: IWebpageDetailsProps) => {
  const pageExtension = page.ext || ".html";

  const toggleEditPageDetailsPanel = usePanelsStore((state) => state.toggleEditPageDetailsPanel);

  const openCopyDoc = () => window.open(page.copy_doc_link);

  const openGitHub = () => {
    if (page.children?.length) {
      window.open(`${config.ghLink(project)}${page.name}/index${pageExtension}`);
    } else {
      window.open(`${config.ghLink(project)}${page.name}${pageExtension}`);
    }
  };

  const openFigma = () => window.open(page.figma_link);
  return (
    <>
      <div className="l-webpage__details-header">
        <h2 className="p-text--small-caps">Page Details</h2>
        <Button appearance="base" className="u-no-margin" hasIcon onClick={toggleEditPageDetailsPanel} small>
          <i className="p-icon--edit" />
        </Button>
        <EditPageDetailsPanel page={page} project={project} />
      </div>
      <div className="l-webpage__details">
        <div className="label u-text--muted">Published page</div>
        <div className="value">
          <a href={`https://${project}${page.url}`} rel="noopener noreferrer" target="_blank">
            View live page <i className="p-icon--external-link" />
          </a>
        </div>

        <div className="label u-text--muted">
          Owner
          <IconTextWithTooltip icon="information" message={config.tooltips.ownerDef} />
        </div>
        <div className="value">{page.owner.name}</div>

        <div className="label u-text--muted">
          Contributors
          <IconTextWithTooltip icon="information" message={config.tooltips.reviewerDef} />
        </div>
        <div className="value">{page.reviewers.map((r) => r.name).join(", ")}</div>

        <div className="label u-text--muted">Related links</div>
        <div className="value">
          <ul className="p-inline-list--middot u-no-margin">
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
    </>
  );
};

export default WebpageDetails;
