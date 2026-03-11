import { useCallback, type ReactNode } from "react";

import { useNavigate } from "react-router-dom";

import PageSearch from "@/components/Search";
import { type IPageOption, usePageOptions } from "@/helpers/usePageOptions";
import { usePages } from "@/services/api/hooks/pages";
import { useStore } from "@/store";

import "./_NavigationSearch.scss";

const Search = (): ReactNode => {
  const { data } = usePages();
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useStore((state) => [state.selectedProject, state.setSelectedProject]);

  const pageOptions = usePageOptions();

  const handleSelect = useCallback(
    (option: IPageOption) => {
      const projectName = option.page.project?.name;
      if (projectName && projectName !== selectedProject?.name) {
        const project = data?.find((p) => p?.name === projectName);
        if (project) setSelectedProject(project);
      }
      navigate(`/app/webpage/${option.name}`);
    },
    [data, navigate, selectedProject?.name, setSelectedProject],
  );

  const handleClear = useCallback(() => {}, []);

  return (
    <PageSearch<IPageOption>
      className="l-search-box"
      disabled={!pageOptions.length}
      onClear={handleClear}
      onSelect={handleSelect}
      options={pageOptions}
      placeholder="Page title or URL"
      value={null}
    />
  );
};

export default Search;
