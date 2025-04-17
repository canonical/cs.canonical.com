import React, { useMemo } from "react";

import { Accordion, Badge, Tooltip } from "@canonical/react-components";

import TableViewRow from "./TableViewRow";

import TableViewRowItem from "@/components/Views/TableView/TableViewRowItem";
import { useProjects } from "@/services/api/hooks/projects";
import type { IPage, IPagesResponse } from "@/services/api/types/pages";

const TableView: React.FC = () => {
  const { data: projects } = useProjects();

  const getAccordionBadgeCount = useMemo(() => {
    function countPages(page: IPage): number {
      if (!page) return 0;
      return 1 + page.children?.reduce((acc, child) => acc + countPages(child), 0);
    }

    return (project: IPagesResponse["data"]) => countPages(project.templates);
  }, []);

  const getAccordionTitle = useMemo(() => {
    return (project: IPagesResponse["data"]) => (
      <span style={{ display: "inline-flex", alignItems: "baseline" }}>
        <span className="p-muted-heading" style={{ margin: "0 0.5rem" }}>
          {project.name}
        </span>
        <Badge value={getAccordionBadgeCount(project)} />
      </span>
    );
  }, [getAccordionBadgeCount]);

  const getAccordionContent = useMemo(() => {
    return (project: IPagesResponse["data"]) => (
      <table>
        <tbody>
          <TableViewRow page={project.templates} />
          {project.templates.children.map((page) => (
            <TableViewRowItem key={page.url} page={page} />
          ))}
        </tbody>
      </table>
    );
  }, []);

  const getAccordionSections = useMemo(() => {
    if (!projects?.length) return [];
    return projects.map((project) => ({
      title: getAccordionTitle(project),
      content: getAccordionContent(project),
    }));
  }, [projects, getAccordionTitle, getAccordionContent]);

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
