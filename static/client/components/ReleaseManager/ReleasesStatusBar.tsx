import { type ReactNode, useMemo } from "react";

import { ActionButton, Button, Chip } from "@canonical/react-components";

import { getReleaseDemoUrl, RELEASES_PR_STATUS } from "./utils";
import type { IReleaseStatus } from "@/services/api/types/releases";

interface IReleasesStatusBarProps {
  status: IReleaseStatus;
  dirtyCount: number;
  isLoading: boolean;
  onAddChecksum?: () => void;
  onSubmit: () => void;
}

const ReleasesStatusBar = ({
  status,
  dirtyCount,
  isLoading,
  onAddChecksum,
  onSubmit,
}: IReleasesStatusBarProps): ReactNode => {
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

  const demoUrl = getReleaseDemoUrl(prNumber);
  const chipAppearance = status.pr_exists ? RELEASES_PR_STATUS.inProgressAppearance : undefined;
  const chipValue = status.pr_exists ? RELEASES_PR_STATUS.inProgressLabel : RELEASES_PR_STATUS.notStartedLabel;

  const openExternalLink = (url: string | null): void => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="l-releases-layout__status-bar">
      <div className="grid-row">
        <div className="l-releases-layout__status-title grid-col-2">
          <h2 className="p-heading--4">{onAddChecksum ? "Checksums" : "Releases"}</h2>
          <Chip appearance={chipAppearance} className="l-releases-layout__status-chip" isReadOnly value={chipValue} />
        </div>
        <div className="l-releases-layout__status-actions grid-col-2 grid-col-start-large-7">
          <Button className="u-no-margin" disabled={!prUrl} hasIcon onClick={() => openExternalLink(prUrl)}>
            <i className="p-icon--show" /> <span>View PR on GitHub</span>
          </Button>
          <Button className="u-no-margin" disabled={!demoUrl} hasIcon onClick={() => openExternalLink(demoUrl)}>
            <i className="p-icon--desktop" /> <span>View demo</span>
          </Button>
          <ActionButton className="u-no-margin" disabled={dirtyCount === 0} loading={isLoading} onClick={onSubmit}>
            <i className="p-icon--change-version" />
            {"  "}
            <span>Submit changes</span>
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
