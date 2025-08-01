import { useCallback, useEffect, useMemo } from "react";

import { Select, Spinner } from "@canonical/react-components";
import { useLocation } from "react-router-dom";

import { useProjects } from "@/services/api/hooks/projects";
import { useStore } from "@/store";

const SiteSelector = (): JSX.Element | null => {
  const location = useLocation();
  const { unfilteredProjects: projects, isLoading } = useProjects();

  const [selectedProject, setSelectedProject] = useStore((state) => [state.selectedProject, state.setSelectedProject]);

  // This hook presets the SiteSelector with a value, either from URL or just with the first option
  useEffect(() => {
    if (projects?.length && !selectedProject) {
      // get project name from URL
      const match = location.pathname.match(/\/app\/webpage\/([^/]+)/);
      let projectFromURL;
      if (match) {
        projectFromURL = projects?.find((p) => p.name === match[1]);
      }
      setSelectedProject(projectFromURL || projects[0]);
    }
  }, [location, projects, selectedProject, setSelectedProject]);

  // Filter out any undefined projects
  const fetchedProjects = useMemo(() => projects?.filter((project) => project), [projects]);

  const handleProjectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const project = fetchedProjects?.find((p) => p.name === e.target.value);
      if (project) {
        setSelectedProject(project);
      }
    },
    [fetchedProjects, setSelectedProject],
  );

  if (isLoading || fetchedProjects?.length !== projects?.length)
    return (
      <>
        <span>
          <Spinner />
          &nbsp;&nbsp;Loading...
        </span>
      </>
    );

  return selectedProject ? (
    <Select
      className="l-site-selector"
      labelClassName="p-text--small-caps l-site-selector__label"
      onChange={handleProjectChange}
      options={projects
        ?.filter((project) => project)
        .map((project) => ({
          label: project.name,
          value: project.name,
        }))}
      value={selectedProject?.name}
    />
  ) : null;
};

export default SiteSelector;
