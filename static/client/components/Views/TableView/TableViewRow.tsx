import React from "react";

import { Button } from "@canonical/react-components";
import { useNavigate } from "react-router-dom";

import Products from "./Products";
import Reviewers from "./Reviewers";

import NavigationElementBadge from "@/components/Navigation/NavigationElement/NavigationElementBadge";
import type { IPage } from "@/services/api/types/pages";

interface TableViewRowProps {
  page: IPage;
}

const TableViewRow: React.FC<TableViewRowProps> = ({ page }) => {
  const navigate = useNavigate();

  function onPageSelect(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, page: IPage) {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/app/webpage/${page.project?.name}${page.url}`);
  }

  return (
    <tr data-id={page.id} data-parent-id={page.parent_id}>
      <td>
        <span className="u-has-icon">
          <NavigationElementBadge appearance="" page={page} />
          <Button appearance="link" onClick={(e) => onPageSelect(e, page)}>
            {page.url || "/"}
          </Button>
        </span>
      </td>
      <td>{page.owner?.name}</td>
      <td>
        <Reviewers page={page} />
      </td>
      <td>
        <Products page={page} />
      </td>
    </tr>
  );
};

export default TableViewRow;
