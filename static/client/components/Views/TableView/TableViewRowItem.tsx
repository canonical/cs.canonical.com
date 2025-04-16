import React from "react";

import { Button } from "@canonical/react-components";
import { useNavigate } from "react-router-dom";

import NavigationElementBadge from "@/components/Navigation/NavigationElement/NavigationElementBadge";
import type { IPage } from "@/services/api/types/pages";

interface TableViewRowItemProps {
  page: IPage;
}

const TableViewRowItem: React.FC<TableViewRowItemProps> = ({ page }) => {
  const navigate = useNavigate();

  function onPageSelect(e, page: IPage) {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/app/webpage/${page.project?.name}${page.url}`);
  }

  function getReviewers(page: IPage) {
    let reviewers = page.reviewers.map((reviewer) => reviewer.name);
    return reviewers.join(", ");
  }

  function getProducts(page: IPage) {
    return page.products.map((product) => product.name).join(", ");
  }

  return (
    <>
      <tr data-id={page.id} data-parent-id={page.parent_id}>
        <td>
          <NavigationElementBadge appearance="" page={page} />
          <span style={{ marginLeft: "0.5rem" }}>
            <Button appearance="link" onClick={(e) => onPageSelect(e, page)}>
              {page.url || "/"}
            </Button>
          </span>
        </td>
        <td>{page.owner?.name}</td>
        <td>{getReviewers(page)}</td>
        <td>{getProducts(page)}</td>
      </tr>
      {page.children.map((child) => {
        return <TableViewRowItem key={child.url} page={child} />;
      })}
    </>
  );
};

export default TableViewRowItem;
