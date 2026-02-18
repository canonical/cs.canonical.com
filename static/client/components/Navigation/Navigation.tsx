import React, { useCallback, useState, type ReactNode } from "react";

import { Button } from "@canonical/react-components";
import classNames from "classnames";
import { useLocation, useNavigate } from "react-router-dom";

import NavigationBanner from "./NavigationBanner";
import NavigationItems from "./NavigationItems";

import NavigationCollapseToggle from "@/components/Navigation/NavigationCollapseToggle";
import SiteSelector from "@/components/SiteSelector";
import { VIEW_OWNED, VIEW_REVIEWED, VIEW_TABLE, VIEW_TREE } from "@/config";
import { useProjects } from "@/services/api/hooks/projects";
import type { IUser } from "@/services/api/types/users";
import type { TView } from "@/services/api/types/views";
import { useStore } from "@/store";
import { useViewsStore } from "@/store/views";

const Navigation = (): ReactNode => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [user, setUser] = useStore((state) => [state.user, state.setUser]);
  const [view, setView, setExpandedProject] = useViewsStore((state) => [
    state.view,
    state.setView,
    state.setExpandedProject,
  ]);
  const { data: projects, isLoading } = useProjects();

  const logout = useCallback(() => {
    setUser({} as IUser);
    window.open("/logout", "_self");
  }, [setUser]);

  const handleNewPageClick = useCallback(() => {
    navigate("/app/new-webpage");
  }, [navigate]);

  const changeView = useCallback(
    (view: TView) => {
      setExpandedProject("");
      setView(view);
      if ([VIEW_OWNED, VIEW_REVIEWED, VIEW_TABLE].includes(view)) {
        navigate(`/app/views/${view}`);
      }

      if ([VIEW_TREE].includes(view)) {
        navigate("/app");
      }
    },
    [navigate, setExpandedProject, setView],
  );

  const isViewActive = useCallback(
    (linkView: TView) => {
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
                <hr className="p-rule u-hide--small" />
                <Button appearance="" className="l-new-webpage-button" hasIcon onClick={handleNewPageClick}>
                  <React.Fragment key=".0">
                    <i className="p-icon--plus" /> <span>Request new page</span>
                  </React.Fragment>
                </Button>
              </div>
            </div>
            <div className="p-panel__content">
              <ul className="u-no-margin u-no-padding">
                <li
                  className={`p-side-navigation__link ${location.pathname === "/app/views/table" && view !== VIEW_TREE && "is-active"}`}
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
                >
                  <span className="u-has-icon">
                    <i className="p-icon--switcher-environments is-dark" />
                    Tree view
                  </span>
                </li>
              </ul>
              {isViewActive(VIEW_TREE) && (
                <>
                  <SiteSelector />
                  {!(isLoading || !projects.length) && <NavigationItems />}
                </>
              )}
            </div>
            <div className="p-panel__views">
              <hr className="p-rule" />
              <li
                className={`p-side-navigation__link ${location.pathname === "/app/releases" ? "is-active" : ""}`}
                onClick={() => navigate("/app/releases")}
              >
                <span className="u-has-icon">
                  <i className="p-icon--repository is-dark" />
                  Releases
                </span>
              </li>
              <hr className="p-rule" />
              <p className="p-muted-heading u-text--muted l-sidebar-section-title">Quick views</p>
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
              <hr className="p-rule" />
              {user?.name && (
                <div className="u-no-margin u-truncate p-side-navigation__label">
                  <span className="u-has-icon">
                    <i className="p-icon--user" />
                    {user.name}
                  </span>
                </div>
              )}
              <div className="p-side-navigation__link" onClick={logout} role="button">
                <span className="u-has-icon">
                  <i className="p-icon--logout is-light" />
                  Log out
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
