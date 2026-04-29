import { useCallback, useState, type ReactNode } from "react";

import { Icon } from "@canonical/react-components";

import type { IPage } from "@/services/api/types/pages";

type TreeViewProps = {
  pages: IPage[];
  onPageSelect: (page: IPage) => void;
};

type TreeNodeProps = {
  page: IPage;
  expanded: Set<string>;
  onToggle: (key: string) => void;
  onPageSelect: (page: IPage) => void;
};

const nodeKey = (page: IPage): string => `${page.project?.name ?? ""}${page.url ?? ""}`;

const TreeNode = ({ page, expanded, onToggle, onPageSelect }: TreeNodeProps): ReactNode => {
  const key = nodeKey(page);
  const hasChildren = (page.children?.length ?? 0) > 0;
  const isExpanded = expanded.has(key);
  const isDir = page.ext === ".dir";
  const displayUrl = `${page.project?.name ?? ""}${page.url ?? ""}`;

  return (
    <li aria-expanded={hasChildren ? isExpanded : undefined} role="treeitem">
      <div className="full-site-view__tree-row">
        {hasChildren ? (
          <button
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${displayUrl}`}
            className="full-site-view__tree-toggle"
            onClick={() => onToggle(key)}
            type="button"
          >
            <Icon name="chevron-down" />
          </button>
        ) : (
          <span aria-hidden="true" className="full-site-view__tree-toggle--spacer" />
        )}

        {isDir ? (
          <span className="full-site-view__tree-label--dir">{displayUrl}</span>
        ) : (
          <button
            className="p-button--link u-no-margin--bottom u-no-padding u-align-text--left"
            onClick={() => onPageSelect(page)}
            type="button"
          >
            {displayUrl} <i className="p-icon--external-link" />
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <ul role="group">
          {page.children.map((child) => (
            <TreeNode
              expanded={expanded}
              key={nodeKey(child)}
              onPageSelect={onPageSelect}
              onToggle={onToggle}
              page={child}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const TreeView = ({ pages, onPageSelect }: TreeViewProps): ReactNode => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const onToggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (pages.length === 0) {
    return <p className="full-site-view__tree-empty">No pages found.</p>;
  }

  return (
    <ul className="full-site-view__tree" role="tree">
      {pages.map((page) => (
        <TreeNode expanded={expanded} key={nodeKey(page)} onPageSelect={onPageSelect} onToggle={onToggle} page={page} />
      ))}
    </ul>
  );
};

export default TreeView;
