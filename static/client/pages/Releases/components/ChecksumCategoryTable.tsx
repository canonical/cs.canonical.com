import { type ReactNode } from "react";

import { Button, Icon } from "@canonical/react-components";

import { formatInputLabel } from "@/pages/Releases/utils";

interface IChecksumCategoryTableProps {
  category: string;
  versions: Record<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (version: string, hash: string) => void;
  onDelete: (version: string) => void;
}

const ChecksumCategoryTable = ({
  category,
  versions,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: IChecksumCategoryTableProps): ReactNode => {
  const versionEntries = Object.entries(versions);
  const safeId = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const tabId = `checksum-tab-${safeId}`;
  const panelId = `checksum-panel-${safeId}`;

  return (
    <li className="p-accordion__group">
      <div className="p-accordion__heading" role="heading">
        <button
          aria-controls={panelId}
          aria-expanded={isExpanded}
          className="p-accordion__tab"
          id={tabId}
          onClick={onToggle}
          type="button"
        >
          {formatInputLabel(category)}
        </button>
      </div>
      <section aria-hidden={!isExpanded} aria-labelledby={tabId} className="p-accordion__panel" id={panelId}>
        <table className="p-table l-checksum-table__table">
          <thead>
            <tr>
              <th className="l-checksum-table__col--version">Version</th>
              <th className="l-checksum-table__col--image">Image</th>
              <th className="l-checksum-table__col--action">Action</th>
            </tr>
          </thead>
          <tbody>
            {versionEntries.length > 0 ? (
              versionEntries.map(([version, hash]) => (
                <tr key={version}>
                  <td>{version}</td>
                  <td className="l-checksum-table__hash">{hash}</td>
                  <td>
                    <Button
                      appearance="base"
                      aria-label={`Edit checksum for ${version}`}
                      className="u-no-margin"
                      dense
                      hasIcon
                      onClick={() => onEdit(version, hash)}
                    >
                      <Icon name="edit" />
                    </Button>
                    <Button
                      appearance="base"
                      aria-label={`Delete checksum for ${version}`}
                      className="u-no-margin"
                      dense
                      hasIcon
                      onClick={() => onDelete(version)}
                    >
                      <Icon name="delete" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="u-text--muted" colSpan={3}>
                  No checksums in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </li>
  );
};

export default ChecksumCategoryTable;
