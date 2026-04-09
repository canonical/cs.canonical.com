import { type ReactNode, useMemo } from "react";

import { ActionButton, Button } from "@canonical/react-components";

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

  return (
    <div className="l-releases-layout__status-bar">
      <div className="l-releases-layout__status-title">
        <h2 className="p-heading--4 u-no-margin--bottom">Releases</h2>
        {status.pr_exists ? (
          <span className="p-chip is-caution">
            <span className="p-chip__value">In progress</span>
          </span>
        ) : (
          <span className="p-chip">
            <span className="p-chip__value">No release in progress</span>
          </span>
        )}
      </div>
      <div className="l-releases-layout__status-actions">
        <Button disabled={!prUrl} onClick={() => prUrl && window.open(prUrl, "_blank", "noopener,noreferrer")}>
          View PR on GitHub
        </Button>
        <Button
          disabled={!demoUrl}
          onClick={() => demoUrl && window.open(demoUrl, "_blank", "noopener,noreferrer")}
        >
          View demo
        </Button>
        <ActionButton appearance="positive" disabled={dirtyCount === 0} loading={isLoading} onClick={onSubmit}>
          Submit changes
        </ActionButton>
      </div>
    </div>
  );
};

export default ReleasesStatusBar;