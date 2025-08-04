import { Badge } from "@canonical/react-components";

import { useProjects } from "@/services/api/hooks/projects";
import type { IPage, IPagesResponse } from "@/services/api/types/pages";

interface ProjectTitleProps {
  project: IPagesResponse["data"];
}

function countPages(page: IPage): number {
  if (!page) return 0;
  const children = page.children ?? [];
  return 1 + children?.reduce((acc, child) => acc + countPages(child), 0);
}

const ProjectTitle: React.FC<ProjectTitleProps> = ({ project }) => {
  const { isFilterApplied } = useProjects();
  return (
    <span className="u-sv1">
      <span className="p-muted-heading" style={{ margin: "0 0.5rem" }}>
        {project.name}
      </span>
      <Badge className="u-no-padding--top" value={countPages(project.templates) - (isFilterApplied ? 1 : 0)} />
    </span>
  );
};

export default ProjectTitle;
