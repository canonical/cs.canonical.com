import React, { useMemo } from "react";

import { Accordion, Tooltip } from "@canonical/react-components";

import ProjectContent from "./ProjectContent";
import ProjectTitle from "./ProjectTitle";

import { useProjects } from "@/services/api/hooks/projects";

const TableView: React.FC = () => {
  const { data: projects } = useProjects();

  const getAccordionSections = useMemo(() => {
    if (!projects?.length) return [];
    return projects.map((project) => ({
      title: <ProjectTitle project={project} />,
      content: <ProjectContent project={project} />,
    }));
  }, [projects]);

  return (
    <>
      <table>
        <thead>
          <tr style={{ borderBottom: "none" }}>
            <th>Url</th>
            <th>
              <Tooltip message="Owners request the page and must approve the page for it to go live." zIndex={999}>
                Owner&nbsp;
                <i className="p-icon--information" />
              </Tooltip>
            </th>
            <th>
              <Tooltip
                message="Reviewers can contribute to page content, but they can't approve the page to go live."
                zIndex={999}
              >
                Reviewers&nbsp;
                <i className="p-icon--information" />
              </Tooltip>
            </th>
            <th>Products</th>
          </tr>
        </thead>
      </table>

      <Accordion sections={getAccordionSections} />
    </>
  );
};

export default TableView;
