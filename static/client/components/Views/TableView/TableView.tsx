import React from "react";

import { Accordion, Badge, Tooltip } from "@canonical/react-components";

import TableViewRowItem from "@/components/Views/TableView/TableViewRowItem";
import { useProjects } from "@/services/api/hooks/projects";
import type { IPage, IPagesResponse } from "@/services/api/types/pages";

const TableView: React.FC = () => {
  const { data: projects } = useProjects();

  function getAccordionSections() {
    let sections = [];
    if (projects?.length) {
      for (const project of projects) {
        sections.push({
          title: getAccordionTitle(project),
          content: getAccordionContent(project),
        });
      }
    }
    return sections;
  }

  function getAccordionTitle(project: IPagesResponse["data"]) {
    return (
      <span style={{ display: "inline-flex", alignItems: "baseline" }}>
        <span className="p-muted-heading" style={{ margin: "0 0.5rem" }}>
          {project.name}
        </span>
        <Badge value={getAccordionBadgeCount(project)} />
      </span>
    );
  }

  function getAccordionBadgeCount(project: IPagesResponse["data"]) {
    function countPages(page: IPage): number {
      if (!page) return 0;
      return 1 + page.children?.reduce((acc, child) => acc + countPages(child), 0);
    }

    return countPages(project.templates);
  }

  function getAccordionContent(project: IPagesResponse["data"]) {
    return (
      <table>
        <tbody>
          <TableViewRowItem key={project.name} page={project.templates} />
          {project.templates.children.map((page) => (
            <TableViewRowItem key={page.url} page={page} />
          ))}
        </tbody>
      </table>
    );
  }

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

      <Accordion sections={getAccordionSections()} />
    </>
  );
};

export default TableView;
