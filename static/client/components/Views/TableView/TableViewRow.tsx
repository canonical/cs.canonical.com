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

  const onPageSelect = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, page: IPage) => {
      e.stopPropagation();
      e.preventDefault();
      navigate(`/app/webpage/${page.project?.name}${page.url}`);
    },
    [navigate],
  );

  return (
    <tr data-id={page.id} data-parent-id={page.parent_id} id={`${page?.project?.name}${page.url}`}>
      <td>
        <span className="u-has-icon">
          <NavigationElementBadge status={page.status} />
          <Button
            appearance="link"
            className="u-no-margin--bottom u-no-padding u-align-text--left"
            onClick={(e) => onPageSelect(e, page)}
          >
            {page.url || "/"}
          </Button>
        </span>
      </td>
      <td>{!(page.owner?.name === "Default" || !page.owner?.email) && page.owner?.name}</td>
      <td>
        <Reviewers reviewers={page.reviewers} />
      </td>
      <td>
        <Products products={page.products} />
      </td>
    </tr>
  );
};

export default TableViewRow;
