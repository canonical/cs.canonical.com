import TableViewRow from "./TableViewRow";
import TableViewRowItem from "./TableViewRowItem";

import type { IPagesResponse } from "@/services/api/types/pages";

interface ProjectContentProps {
  project: IPagesResponse["data"];
}

const ProjectContent: React.FC<ProjectContentProps> = ({ project }) => {
  return (
    <table>
      <tbody>
        <TableViewRow page={project.templates} />
        {project.templates.children.map((page) => (
          <TableViewRowItem key={page.url} page={page} />
        ))}
      </tbody>
    </table>
  );
};

export default ProjectContent;
