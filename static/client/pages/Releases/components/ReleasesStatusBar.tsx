import { type ReactNode, useMemo } from "react";

import { ActionButton, Button, Chip } from "@canonical/react-components";

import type { IReleaseStatus } from "@/services/api/types/releases";

interface IReleasesStatusBarProps {
  status: IReleaseStatus;
  dirtyCount: number;
  isLoading: boolean;
  onSubmit: () => void;
}

const ReleasesStatusBar = ({ status, dirtyCount, isLoading, onSubmit }: IReleasesStatusBarProps): ReactNode => {
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
      <div className="l-releases-layout__status-title">
        <h2 className="p-heading--4">Releases</h2>
        <Chip className="u-no-margin--bottom l-releases-layout__sidebar-chip" value={chipValue} appearance={chipAppearance} />
      </div>
      <div className="l-releases-layout__status-actions">
        <Button className="u-no-margin--bottom" disabled={!prUrl} onClick={() => openExternalLink(prUrl)}>
          View PR on GitHub
        </Button>
        <Button
          className="u-no-margin--bottom"
          disabled={!demoUrl}
          onClick={() => openExternalLink(demoUrl)}
        >
          View demo
        </Button>
        <ActionButton className="u-no-margin--bottom" appearance="positive" disabled={dirtyCount === 0} loading={isLoading} onClick={onSubmit}>
          Submit changes
        </ActionButton>
      </div>
    </div>
  );
};

export default ReleasesStatusBar;