import { type ReactNode, useMemo } from "react";

import { ActionButton, Button, Chip } from "@canonical/react-components";

import type { IReleaseStatus } from "@/services/api/types/releases";

interface IReleasesStatusBarProps {
  status: IReleaseStatus;
  dirtyCount: number;
  isLoading: boolean;
  onAddChecksum?: () => void;
  onSubmit: () => void;
}

const ReleasesStatusBar = ({ status, dirtyCount, isLoading, onAddChecksum, onSubmit }: IReleasesStatusBarProps): ReactNode => {
  const prNumber = useMemo(() => {
    if (!status.pr) return null;
    const number = (status.pr as Record<string, unknown>).number;
    return typeof number === "number" || typeof number === "string" ? String(number) : null;
  }, [status.pr]);

  const prUrl = useMemo(() => {
    if (!status.pr) return null;
    const htmlUrl = (status.pr as Record<string, unknown>).html_url;
    return typeof htmlUrl === "string" ? htmlUrl : null;
  }, [status.pr]);

  const demoUrl = prNumber ? `https://ubuntu-com-${prNumber}.demos.haus/` : null;
  const chipAppearance = status.pr_exists ? "information" : undefined;
  const chipValue = status.pr_exists ? "In progress" : "Not started";

  const openExternalLink = (url: string | null): void => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="l-releases-layout__status-bar">
      <div className="grid-row">

      <div className="l-releases-layout__status-title grid-col-1">
        <h2 className="p-heading--4">Releases</h2>
        <Chip className="u-no-margin--bottom l-releases-layout__sidebar-chip" value={chipValue} appearance={chipAppearance} />
      </div>
      <div className="l-releases-layout__status-actions grid-col-2 grid-col-start-large-7">
        <Button className="u-no-margin" disabled={!prUrl} hasIcon onClick={() => openExternalLink(prUrl)}>
          <i className="p-icon--show" />
          {' '} <span>View PR on GitHub</span>
        </Button>
        <Button
          className="u-no-margin"
          disabled={!demoUrl}
          hasIcon
          onClick={() => openExternalLink(demoUrl)}
        >
          <i className="p-icon--desktop" />
          {' '}<span>
          View demo
          </span>
        </Button>
        <ActionButton className="u-no-margin" appearance="positive" disabled={dirtyCount === 0} loading={isLoading} onClick={onSubmit}>
      <i className="p-icon--change-version" />
          {'  '}<span>Submit changes</span>
        </ActionButton>
        {onAddChecksum && (
          <Button className="u-no-margin" hasIcon onClick={onAddChecksum}>
            <i className="p-icon--plus" /> <span>Add checksum</span>
          </Button>
        )}
      </div>
    </div>
    </div>
  );
};

export default ReleasesStatusBar;