import type { ReactNode } from "react";

import classNames from "classnames";

import config from "@/config";
import { useViewsStore } from "@/store/views";

const ProjectSidebar = (): ReactNode => {
  const [activeProject, setActiveProject] = useViewsStore((state) => [state.activeProject, state.setActiveProject]);

  return (
    <div className="full-site-view__sidebar">
      <h3 className="p-text--small-caps u-no-margin--bottom">Full site view</h3>
      <ul className="p-side-navigation__list u-no-margin u-no-padding">
        {config.allProjects.map((project) => (
          <li className="p-side-navigation__item" key={project}>
            <button
              className={classNames("p-side-navigation__link full-site-view__project-button u-no-margin", {
                "is-active": activeProject === project,
              })}
              onClick={() => setActiveProject(project)}
              type="button"
            >
              {project}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectSidebar;
