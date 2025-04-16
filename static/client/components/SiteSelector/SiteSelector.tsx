import { useCallback, useEffect } from "react";

import { Select, Spinner } from "@canonical/react-components";
import { useLocation } from "react-router-dom";

import { useProjects } from "@/services/api/hooks/projects";
import { useStore } from "@/store";

const SiteSelector = (): JSX.Element | null => {
  const location = useLocation();
  const { data: projects, isLoading } = useProjects();

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

  const handleProjectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const project = projects?.find((p) => p.name === e.target.value);
      if (project) {
        setSelectedProject(project);
      }
    },
    [projects, setSelectedProject],
  );

  if (isLoading || !projects?.length)
    return (
      <>
        <Spinner />
        <span>&nbsp;&nbsp;Loading...</span>
      </>
    );

  return selectedProject ? (
    <Select
      className="l-site-selector"
      labelClassName="p-text--small-caps l-site-selector__label"
      onChange={handleProjectChange}
      options={projects?.map((project) => ({
        label: project.name,
        value: project.name,
      }))}
      value={selectedProject?.name}
    />
  ) : null;
};

export default SiteSelector;
