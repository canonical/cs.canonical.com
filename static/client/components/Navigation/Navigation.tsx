import React, { useCallback, useState } from "react";

import { Button } from "@canonical/react-components";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";

import NavigationBanner from "./NavigationBanner";
import NavigationItems from "./NavigationItems";

import NavigationCollapseToggle from "@/components/Navigation/NavigationCollapseToggle";
import SiteSelector from "@/components/SiteSelector";
import { useAuth } from "@/services/api/hooks/auth";
import { useStore } from "@/store";

const Navigation = (): JSX.Element => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const setUser = useStore((state) => state.setUser);
  const { data: user } = useAuth();

  const logout = useCallback(() => {
    setUser(null);
    window.open("/logout", "_self");
  }, [setUser]);

  const handleNewPageClick = useCallback(() => {
    navigate("/app/new-webpage");
  }, [navigate]);

  return (
    <>
      <header className="l-navigation-bar">
        <div className="p-panel is-dark">
          <div className="p-panel__header">
            <NavigationBanner />
            <div className="p-panel__controls u-nudge-down--small">
              <Button appearance="base" className="has-icon" onClick={() => setIsCollapsed(!isCollapsed)}>
                Menu
              </Button>
            </div>
          </div>
        </div>
      </header>
      <nav aria-label="main" className={classNames("l-navigation", { "is-collapsed": isCollapsed })} role="navigation">
        <div className="l-navigation__drawer">
          <div className="p-panel is-dark">
            <div className="p-panel__header is-sticky">
              <NavigationBanner />
              <div className="l-navigation__controls">
                <NavigationCollapseToggle isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
              </div>
              <SiteSelector />
              <Button appearance="" className="l-new-webpage-button" hasIcon onClick={handleNewPageClick}>
                <React.Fragment key=".0">
                  <i className="p-icon--plus" /> <span>Request new page</span>
                </React.Fragment>
              </Button>
            </div>
            <div className="p-panel__content">
              <NavigationItems />
            </div>
            <div className="p-panel__footer p-side-navigation--icons">
              <div className="u-no-margin u-truncate">
                <span>{user?.name}</span>
              </div>
              <div className="p-text--small u-text--muted u-truncate">
                <span>{user?.email}</span>
              </div>
              <hr className="p-rule" />
              <Button appearance="base" className="p-side-navigation__link" onClick={logout}>
                <i className="p-icon--logout is-light p-side-navigation__icon" />
                <span className="p-side-navigation__label">Log out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
