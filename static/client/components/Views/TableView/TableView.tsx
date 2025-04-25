import React, { useEffect, useMemo } from "react";

import { Accordion, Spinner } from "@canonical/react-components";
import { useLocation } from "react-router-dom";

import ProjectContent from "./ProjectContent";
import ProjectTitle from "./ProjectTitle";

import IconTextWithTooltip from "@/components/Common/IconTextWithTooltip";
import config, { VIEW_TABLE, VIEW_TREE } from "@/config";
import { useProjects } from "@/services/api/hooks/projects";
import type { IViewFilter } from "@/services/api/types/views";
import { useViewsStore } from "@/store/views";

interface TableViewProps {
  customFilters?: IViewFilter;
}

const TableView: React.FC<TableViewProps> = ({ customFilters }) => {
  const { data: projects, isLoading } = useProjects();
  const [view, setView, setFilter, expandedProject, setExpandedProject] = useViewsStore((state) => [
    state.view,
    state.setView,
    state.setFilter,
    state.expandedProject,
    state.setExpandedProject,
  ]);

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
      setFilter(customFilters || { owners: [], reviewers: [], products: [], query: "" });
    }
  }, [location.pathname, setFilter, setView, view, customFilters]);

  console.log("table view being rendered");

  return (
    <>
      <table>
        <thead>
          <tr style={{ borderBottom: "none" }}>
            <th>Url</th>
            <th>
              <IconTextWithTooltip icon="information" message={config.tooltips.ownerDef} text="Owner" />
            </th>
            <th>
              <IconTextWithTooltip icon="information" message={config.tooltips.reviewerDef} text="Reviewers" />
            </th>
            <th>Products</th>
          </tr>
        </thead>
      </table>

      {(isLoading || !projects.length) && <Spinner text="Loading projects. Please wait." />}

      {!isLoading && (
        <Accordion expanded={expandedProject} onExpandedChange={setExpandedProject} sections={getAccordionSections} />
      )}
    </>
  );
};

export default React.memo(TableView);
