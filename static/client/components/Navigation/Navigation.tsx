import React, { useCallback, useMemo, useState } from "react";

import { Button } from "@canonical/react-components";
import classNames from "classnames";
import { useLocation, useNavigate } from "react-router-dom";

import NavigationBanner from "./NavigationBanner";
import NavigationItems from "./NavigationItems";

import NavigationCollapseToggle from "@/components/Navigation/NavigationCollapseToggle";
import SiteSelector from "@/components/SiteSelector";
import { VIEW_OWNED, VIEW_REVIEWED, VIEW_TABLE, VIEW_TREE } from "@/config";
import type { IUser } from "@/services/api/types/users";
import type { TView } from "@/services/api/types/views";
import { useStore } from "@/store";
import { useViewsStore } from "@/store/views";

const Navigation = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [user, setUser] = useStore((state) => [state.user, state.setUser]);
  const [view, setView] = useViewsStore((state) => [state.view, state.setView]);

  const logout = useCallback(() => {
    setUser({} as IUser);
    window.open("/logout", "_self");
  }, [setUser]);

  const handleNewPageClick = useCallback(() => {
    navigate("/app/new-webpage");
  }, [navigate]);

  const changeView = useCallback(
    (view: TView) => {
      setView(view);
      if ([VIEW_OWNED, VIEW_REVIEWED].includes(view)) navigate(`/app/views/${view}`);
      if ([VIEW_TABLE, VIEW_TREE].includes(view)) navigate("/app");
    },
    [navigate, setView],
  );

  const isViewActive = useMemo(
    () => (linkView: TView) => {
      if (view === VIEW_TREE) return linkView === view;
      return linkView === view && location.pathname === `/app/views/${linkView}`;
    },
    [location.pathname, view],
  );

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
              <div>
                <Button appearance="" className="l-new-webpage-button" hasIcon onClick={handleNewPageClick}>
                  <React.Fragment key=".0">
                    <i className="p-icon--plus" /> <span>Request new page</span>
                  </React.Fragment>
                </Button>
              </div>
            </div>
            <hr className="p-rule" />
            <div className="p-panel__content">
              <ul className="u-no-margin u-no-padding">
                <li
                  className={`p-side-navigation__link ${location.pathname === "/app" && view !== VIEW_TREE && "is-active"}`}
                  onClick={() => changeView(VIEW_TABLE)}
                >
                  <span className="u-has-icon">
                    <i className="p-icon--switcher-dashboard is-dark" />
                    Table view
                  </span>
                </li>
                <li
                  className={`p-side-navigation__link ${isViewActive(VIEW_TREE) && "is-active"}`}
                  onClick={() => changeView(VIEW_TREE)}
                  style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                  <span className="u-has-icon">
                    <i className="p-icon--switcher-environments is-dark" />
                    Tree view
                  </span>

                  {isViewActive(VIEW_TREE) && (
                    <>
                      <SiteSelector />
                      <NavigationItems />
                    </>
                  )}
                </li>
              </ul>
            </div>
            <div style={{ marginTop: "2rem" }}>
              <hr className="p-rule" />
              <p className="p-muted-heading u-text--muted">Quick views</p>
              <ul className="u-no-margin u-no-padding">
                <li
                  className={`p-side-navigation__link ${isViewActive(VIEW_OWNED) && "is-active"}`}
                  onClick={() => changeView(VIEW_OWNED)}
                >
                  <span className="u-has-icon">
                    <i className="p-icon--user" />
                    Owned by me
                  </span>
                </li>
                <li
                  className={`p-side-navigation__link ${isViewActive(VIEW_REVIEWED) && "is-active"}`}
                  onClick={() => changeView(VIEW_REVIEWED)}
                >
                  <span className="u-has-icon">
                    <i className="p-icon--show" />
                    Reviewed by me
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-panel__footer p-side-navigation--icons">
              <div className="u-no-margin u-truncate p-side-navigation__label">
                <span>{user?.name}</span>
              </div>
              <div className="p-text--small u-text--muted u-truncate p-side-navigation__label">
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
