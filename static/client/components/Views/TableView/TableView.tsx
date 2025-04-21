import React, { useEffect, useMemo } from "react";

import { Accordion, Tooltip } from "@canonical/react-components";
import { useLocation } from "react-router-dom";

import ProjectContent from "./ProjectContent";
import ProjectTitle from "./ProjectTitle";

import IconTextWithTooltip from "@/components/Common/IconTextWithTooltip";
import config, { VIEW_TABLE, VIEW_TREE } from "@/config";
import { useProjects } from "@/services/api/hooks/projects";
import { useViewsStore } from "@/store/views";

const TableView: React.FC = () => {
  const { data: projects, isLoading } = useProjects();
  const [view, setView, setFilter] = useViewsStore((state) => [state.view, state.setView, state.setFilter]);
  const [expandedProject, setExpandedProject] = useViewsStore((state) => [
    state.expandedProject,
    state.setExpandedProject,
  ]);

  useEffect(() => {
    if (expandedProject) {
      setExpandedProject(expandedProject);
    }
  }, [expandedProject, setExpandedProject]);

  const location = useLocation();

  const getAccordionSections = useMemo(() => {
    if (!projects?.length) return [];
    return projects.map((project) => ({
      key: project.name,
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
              <IconTextWithTooltip icon="information" message={config.constants.ownerDef} text="Owner" />
            </th>
            <th>
              <IconTextWithTooltip icon="information" message={config.constants.reviewerDef} text="Reviewers" />
            </th>
            <th>Products</th>
          </tr>
        </thead>
      </table>

      {(isLoading || !projects.length) && (
        <>
          <span className="u-has-icon">
            <i className="p-icon--spinner u-animation--spin"></i>
            Loading projects. Please wait.
          </span>
        </>
      )}

      <Accordion expanded={expandedProject} onExpandedChange={setExpandedProject} sections={getAccordionSections} />
    </>
  );
};

export default TableView;
