import { ContextualMenu, List } from "@canonical/react-components";

import RequestHistory from "@/components/Dashboard/History";
import config, { BUG_REPORT, NEW_FEATURE_REQUEST } from "@/config";
import { usePanelsStore } from "@/store/app";

const Requests: React.FC = () => {
  const externalLinks = [
    {
      content: (
        <a href={config.assetsManagerUrl}>
          Visit Asset Manager <i className="p-icon--external-link" />
        </a>
      ),
    },
    {
      content: (
        <a href={config.copyStyleGuideLink}>
          Copy style guide <i className="p-icon--external-link" />
        </a>
      ),
    },
    {
      content: (
        <a href={config.copyDocsFolderLink}>
          Copy docs folder <i className="p-icon--external-link" />
        </a>
      ),
    },
    {
      content: (
        <a href={config.brandRequestsLink}>
          Brand requests <i className="p-icon--external-link" />
        </a>
      ),
    },
  ];

  const [toggleRequestFeaturePanel, toggleReportBugPanel] = usePanelsStore((state) => [
    state.toggleRequestFeaturePanel,
    state.toggleReportBugPanel,
  ]);

  function handleQuickAction(requestType: string) {
    switch (requestType) {
      case BUG_REPORT:
        toggleReportBugPanel();
        break;
      case NEW_FEATURE_REQUEST:
        toggleRequestFeaturePanel();
        break;
    }
  }

  return (
    <div className="grid-row">
      <div className="u-sv3">
        <h4>Dashboard</h4>
        <hr className="p-rule--muted" />
      </div>

      <div className="grid-row p-divider">
        <div className="grid-col-4 p-divider__block">
          <div className="grid-row--50-50">
            <h5 className="p-text--small-caps">Sites requests</h5>
            <div className="grid-col">
              <p>Start a request by choosing your request type from the dropdown</p>
              <ContextualMenu
                hasToggleIcon
                links={config.requestTypes.map((type) => ({
                  children: type,
                  onClick: () => handleQuickAction(type),
                }))}
                position="left"
                toggleAppearance={"positive"}
                toggleLabel="Start a request"
              />
            </div>
            <div className="grid-col">
              <div className="p-image-container--3-2">
                <img
                  alt=""
                  className="p-image-container__image"
                  src="https://assets.ubuntu.com/v1/389492c2-image_container_1.png"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="grid-col-2 p-divider__block">
          <h5 className="p-text--small-caps">Copy doc template</h5>
          <p>Start creating content for a new webpage with a copy doc template.</p>
          <a href={config.copyDocTemplateLink}>
            Get copy doc template <i className="p-icon--external-link" />
          </a>
        </div>
        <div className="grid-col-2 p-divider__block">
          <h5 className="p-text--small-caps">Resources</h5>
          <List items={externalLinks} />
        </div>
      </div>

      <hr className="p-rule" />
      <RequestHistory />
    </div>
  );
};

export default Requests;
