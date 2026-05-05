import { type ReactNode } from "react";

import { NavLink } from "react-router-dom";

const ReleasesSecondaryNav = (): ReactNode => {
  return (
    <aside className="l-releases-layout__sidebar">
      <h2 className="l-releases-layout__sidebar-title p-heading--4">Release manager</h2>
      <hr className="p-rule" />
      <ul className="l-releases-layout__nav-list">
        <li>
          <NavLink
            className={({ isActive }) => `l-releases-layout__nav-link${isActive ? " is-active" : ""}`}
            to="/app/releases/update"
          >
            Update releases
          </NavLink>
        </li>
        <li>
          <NavLink
            className={({ isActive }) => `l-releases-layout__nav-link${isActive ? " is-active" : ""}`}
            to="/app/releases/checksums"
          >
            Update checksums
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default ReleasesSecondaryNav;
