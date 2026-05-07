import { type ReactNode, useCallback, useRef, useState } from "react";

import { Spinner, useToastNotification } from "@canonical/react-components";
import { Outlet } from "react-router-dom";

import ReleasesSecondaryNav from "@/components/ReleaseManager/ReleasesSecondaryNav";
import ReleasesStatusBar from "@/components/ReleaseManager/ReleasesStatusBar";
import { useReleaseFormState } from "@/components/ReleaseManager/useReleaseFormState";
import { useReleases } from "@/services/api/hooks/releases";
import type { IApiBasicError } from "@/services/api/types/query";
import type { IReleasesResponse } from "@/services/api/types/releases";

export interface IReleasesOutletContext {
  data: IReleasesResponse;
  formData: IReleasesResponse["releases"];
  dirtyCount: number;
  isLoading: boolean;
  handleFieldChange: ReturnType<typeof useReleaseFormState>["handleFieldChange"];
  handleChecksumAdd: ReturnType<typeof useReleaseFormState>["handleChecksumAdd"];
  handleChecksumDelete: ReturnType<typeof useReleaseFormState>["handleChecksumDelete"];
  handleSubmit: ReturnType<typeof useReleaseFormState>["handleSubmit"];
  registerAddChecksum: (cb: (() => void) | null) => void;
}

interface IReleasesContentProps {
  data: IReleasesResponse;
}

const ReleasesContent = ({ data }: IReleasesContentProps): ReactNode => {
  const notify = useToastNotification();
  const addChecksumRef = useRef<(() => void) | null>(null);
  const [hasAddChecksum, setHasAddChecksum] = useState(false);

  const registerAddChecksum = useCallback((cb: (() => void) | null) => {
    addChecksumRef.current = cb;
    setHasAddChecksum(cb !== null);
  }, []);

  const handleAddChecksum = useCallback(() => {
    addChecksumRef.current?.();
  }, []);

  const { dirtyCount, formData, handleChecksumAdd, handleChecksumDelete, handleFieldChange, handleSubmit, isLoading } =
    useReleaseFormState({
      releases: data.releases,
      onSubmitSuccess: ({ pr }) => {
        notify.success(
          "This will create a new PR in GitHub or add to an existing one.",
          [{ label: "View on GitHub", onClick: () => window.open(pr.url, "_blank") }],
          "Your release updates are submitted",
        );
      },
      onSubmitError: (error) => {
        const apiError = error as IApiBasicError;
        notify.failure(
          apiError?.detail ?? "Failed to submit changes. Please try again.",
          null,
          apiError?.title ?? null,
        );
      },
    });

  const outletContext: IReleasesOutletContext = {
    data,
    formData,
    dirtyCount,
    isLoading,
    handleFieldChange,
    handleChecksumAdd,
    handleChecksumDelete,
    handleSubmit,
    registerAddChecksum,
  };

  return (
    <div className="l-releases-layout">
      <div className="grid-row">
        <div className="grid-col-2">
          <ReleasesSecondaryNav />
        </div>
        <div className="grid-col-6">
          <div className="l-releases-layout__content p-section">
            <ReleasesStatusBar
              dirtyCount={dirtyCount}
              isLoading={isLoading}
              onAddChecksum={hasAddChecksum ? handleAddChecksum : undefined}
              onSubmit={handleSubmit}
              status={data.status}
            />
            <Outlet context={outletContext} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Releases = (): ReactNode => {
  const { data, error, isLoading } = useReleases();

  if (isLoading) {
    return (
      <div className="p-section">
        <div className="grid-row">
          <Spinner text="Loading releases data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-section">
        <div className="grid-row">
          <div className="p-notification--negative">
            <div className="p-notification__content">
              <p className="p-notification__message">{error.detail || error.title}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-section">
        <div className="grid-row">
          <p className="u-text--muted">No releases data available.</p>
        </div>
      </div>
    );
  }

  return <ReleasesContent data={data} />;
};

export default Releases;
