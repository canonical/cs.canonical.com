import React, { useCallback, useState, type ReactNode } from "react";

import { Button } from "@canonical/react-components";
import classNames from "classnames";
import { useLocation, useNavigate } from "react-router-dom";

import NavigationBanner from "./NavigationBanner";

import NavigationCollapseToggle from "@/components/Navigation/NavigationCollapseToggle";
import Search from "@/components/Search";
import { VIEW_OWNED, VIEW_REQUESTS, VIEW_TABLE, VIEW_TREE } from "@/config";
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
  const logout = useCallback(() => {
    setUser({} as IUser);
    window.open("/logout", "_self");
  }, [setUser]);

  const changeView = useCallback(
    (view: TView) => {
      setExpandedProject("");
      setView(view);
      if ([VIEW_OWNED, VIEW_TABLE, VIEW_REQUESTS].includes(view)) {
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
      <nav aria-label="main" className={classNames("l-navigation", { "is-collapsed": isCollapsed })} role="navigation">
        <div className="l-navigation__drawer">
          <div className="p-panel is-paper">
            <div className="p-panel__header is-sticky">
              <NavigationBanner />
              <div className="l-navigation__controls">
                <NavigationCollapseToggle isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
              </div>
            </div>
            <div className="p-panel__content">
              <div className="p-panel__content-search">
                <hr className="p-rule" />
                <p className="p-text--small-caps">Search pages</p>
                <Search />
                <hr className="p-rule" />
              </div>
              <ul className="u-no-margin u-no-padding">
                <li
                  className={`p-side-navigation__link ${(isViewActive(VIEW_TREE) || location.pathname === "/app") && "is-active"}`}
                  onClick={() => changeView(VIEW_TREE)}
                >
                  <span className="u-has-icon">
                    <i className="p-icon--home" />
                    Main menu
                  </span>
                </li>
                <li
                  className={`p-side-navigation__link ${isViewActive(VIEW_REQUESTS) && "is-active"}`}
                  onClick={() => changeView(VIEW_REQUESTS)}
                >
                  <span className="u-has-icon">
                    <i className="p-icon--file" />
                    Dashboard
                  </span>
                </li>
                <li
                  className={`p-side-navigation__link ${isViewActive(VIEW_OWNED) && "is-active"}`}
                  onClick={() => changeView(VIEW_OWNED)}
                >
                  <span className="u-has-icon">
                    <i className="p-icon--file" />
                    Your pages
                  </span>
                </li>
                <li
                  className={`p-side-navigation__link ${isViewActive(VIEW_TABLE) && "is-active"}`}
                  onClick={() => changeView(VIEW_TABLE)}
                >
                  <span className="u-has-icon">
                    <i className="p-icon--show" />
                    Full site view
                  </span>
                </li>
              </ul>
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
