import { Badge } from "@canonical/react-components";

import type { IPage, IPagesResponse } from "@/services/api/types/pages";

interface ProjectTitleProps {
  project: IPagesResponse["data"];
}

function countPages(page: IPage): number {
  if (!page) return 0;
  return 1 + page.children?.reduce((acc, child) => acc + countPages(child), 0);
}

const ProjectTitle: React.FC<ProjectTitleProps> = ({ project }) => {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline" }}>
      <span className="p-muted-heading" style={{ margin: "0 0.5rem" }}>
        {project.name}
      </span>
      <Badge value={countPages(project.templates)} />
    </span>
  );
};

export default ProjectTitle;
