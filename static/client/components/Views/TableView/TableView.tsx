import React, { useEffect, useMemo } from "react";

import { Accordion, Tooltip } from "@canonical/react-components";
import { useLocation } from "react-router-dom";

import ProjectContent from "./ProjectContent";
import ProjectTitle from "./ProjectTitle";

import { VIEW_TABLE, VIEW_TREE } from "@/config";
import { useProjects } from "@/services/api/hooks/projects";
import { useViewsStore } from "@/store/views";

const TableView: React.FC = () => {
  const { data: projects } = useProjects();
  const [view, setView, setFilter] = useViewsStore((state) => [state.view, state.setView, state.setFilter]);
  const location = useLocation();

  const getAccordionSections = useMemo(() => {
    if (!projects?.length) return [];
    return projects.map((project) => ({
      title: <ProjectTitle project={project} />,
      content: <ProjectContent project={project} />,
    }));
  }, [projects]);

  useEffect(() => {
    if (location.pathname === "/app") {
      if (view !== VIEW_TREE) setView(VIEW_TABLE);
      setFilter({
        owners: [],
        reviewers: [],
        products: [],
        query: "",
      });
    }
  }, [location.pathname, setFilter, setView, view]);

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
