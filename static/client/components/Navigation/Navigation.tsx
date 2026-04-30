import React, { useCallback, useState, type ReactNode } from "react";

import { Button } from "@canonical/react-components";
import classNames from "classnames";
import { useLocation, useNavigate } from "react-router-dom";

import NavigationBanner from "./NavigationBanner";

import NavigationCollapseToggle from "@/components/Navigation/NavigationCollapseToggle";
import NavigationSearch from "@/components/Navigation/NavigationSearch";
import config, { VIEW_OWNED, VIEW_REQUESTS, VIEW_TABLE, VIEW_TREE } from "@/config";
import type { IUser } from "@/services/api/types/users";
import type { TView } from "@/services/api/types/views";
import { useStore } from "@/store";
import { useViewsStore } from "@/store/views";

type MobileDrillTarget = "top" | "fullSiteView";

const Navigation = (): ReactNode => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, _setIsCollapsed] = useState(true);
  const [mobileDrilledTo, setMobileDrilledTo] = useState<MobileDrillTarget>("top");
  const setIsCollapsed = useCallback((next: boolean) => {
    _setIsCollapsed(next);
    if (next) setMobileDrilledTo("top");
  }, []);
  const [user, setUser] = useStore((state) => [state.user, state.setUser]);
  const [view, setView, setExpandedProject, activeProject, setActiveProject] = useViewsStore((state) => [
    state.view,
    state.setView,
    state.setExpandedProject,
    state.activeProject,
    state.setActiveProject,
  ]);
  const logout = useCallback(() => {
    setUser({} as IUser);
    window.open("/logout", "_self");
  }, [setUser]);

  const changeView = useCallback(
    (view: TView) => {
      setExpandedProject("");
      setView(view);
      if ([VIEW_OWNED, VIEW_TABLE].includes(view)) {
        navigate(`/app/views/${view}`);
      }

      if ([VIEW_TREE, VIEW_REQUESTS].includes(view)) {
        navigate("/app");
      }
    },
    [navigate, setExpandedProject, setView],
  );

  const onMobileDrillIn = useCallback(() => {
    setMobileDrilledTo("fullSiteView");
  }, []);

  const onSelectProject = useCallback(
    (project: string) => {
      setActiveProject(project);
      changeView(VIEW_TABLE);
      setIsCollapsed(true);
    },
    [changeView, setActiveProject, setIsCollapsed],
  );

  const isViewActive = useCallback(
    (linkView: TView) => {
      if (view === VIEW_TREE) return linkView === view;
      if (view === VIEW_REQUESTS) return linkView === view;
      return linkView === view && location.pathname === `/app/views/${linkView}`;
    },
    [location.pathname, view],
  );

  return (
    <>
      <header className="l-navigation-bar">
        <div className="p-panel is-paper">
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
      <nav
        aria-label="main"
        className={classNames("l-navigation", {
          "is-collapsed": isCollapsed,
          "l-navigation--drilled": mobileDrilledTo === "fullSiteView",
        })}
        role="navigation"
      >
        <div className="l-navigation__drawer">
          <div className="p-panel is-paper">
            <div className="p-panel__header is-sticky">
              <NavigationBanner />
              <div className="l-navigation__controls">
                <NavigationCollapseToggle isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
              </div>
            </div>
            <div className="p-panel__content">
              <div className="l-navigation__top-list">
                <div className="p-panel__content-search">
                  <hr className="p-rule" />
                  <p className="p-text--small-caps">Search pages</p>
                  <NavigationSearch />
                  <hr className="p-rule u-sv3" />
                </div>
                <ul className="u-no-margin u-no-padding">
                  <li
                    className={classNames("p-side-navigation__link", { "is-active": isViewActive(VIEW_REQUESTS) })}
                    onClick={() => changeView(VIEW_REQUESTS)}
                  >
                    <span className="u-has-icon">
                      <i className="p-icon--file" />
                      Dashboard
                    </span>
                  </li>
                  <li
                    className={classNames("p-side-navigation__link", { "is-active": isViewActive(VIEW_OWNED) })}
                    onClick={() => changeView(VIEW_OWNED)}
                  >
                    <span className="u-has-icon">
                      <i className="p-icon--file" />
                      Your pages
                    </span>
                  </li>
                  <li
                    className={classNames("p-side-navigation__link", "l-navigation__nav-link--desktop", {
                      "is-active": isViewActive(VIEW_TABLE),
                    })}
                    data-testid="nav-link-full-site-view-desktop"
                    onClick={() => changeView(VIEW_TABLE)}
                  >
                    <span className="u-has-icon">
                      <i className="p-icon--show" />
                      Full site view
                    </span>
                  </li>
                  <li
                    aria-label="Open project list"
                    className={classNames("p-side-navigation__link", "l-navigation__nav-link--mobile", {
                      "is-active": isViewActive(VIEW_TABLE),
                    })}
                    onClick={onMobileDrillIn}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onMobileDrillIn();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="u-has-icon">
                      <i className="p-icon--show" />
                      Full site view
                    </span>
                    <i aria-hidden="true" className="p-icon--chevron-right l-navigation__drill-chevron" />
                  </li>
                </ul>
              </div>
              {mobileDrilledTo === "fullSiteView" && (
                <ul className="l-navigation__drilled-list u-no-margin u-no-padding">
                  <li
                    aria-label="Back to main navigation"
                    className="p-side-navigation__link"
                    onClick={() => setMobileDrilledTo("top")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setMobileDrilledTo("top");
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="u-has-icon">
                      <i className="p-icon--chevron-left" />
                      Full site view
                    </span>
                  </li>
                  {config.allProjects.map((project) => (
                    <li
                      className={classNames("p-side-navigation__link", { "is-active": activeProject === project })}
                      key={project}
                      onClick={() => onSelectProject(project)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectProject(project);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <span>{project}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-panel__footer p-side-navigation--icons">
              {user?.name && (
                <div className="u-truncate p-side-navigation__link">
                  <span className="u-has-icon">
                    <i className="p-icon--profile" />
                    <span className="p-side-navigation__label">{user.name}</span>
                  </span>
                </div>
              )}
              <div className="p-side-navigation__link" onClick={logout} role="button">
                <span className="u-has-icon">
                  <i className="p-icon--logout" />
                  <span className="p-side-navigation__label">Log out</span>
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
