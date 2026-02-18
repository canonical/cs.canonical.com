import { type ReactNode, useCallback, useState } from "react";

import { Button, Spinner } from "@canonical/react-components";

import ReleaseForm from "@/components/ReleaseForm";
import { useReleases } from "@/services/api/hooks/releases";
import { isRecord } from "@/services/api/types/releases";

const Releases = (): ReactNode => {
  const { data, error, isLoading } = useReleases();
  const [showForm, setShowForm] = useState(false);
  const hideForm = useCallback(() => setShowForm(false), []);
  if (isLoading) {
    return (
      <div className="p-section">
        <div className="grid-row">
          <h1>Release management</h1>
          <Spinner text="Loading releases data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-section">
        <div className="grid-row">
          <h1>Release management</h1>
          <div className="p-notification--negative">
            <div className="p-notification__content">
              <p className="p-notification__message">
                Failed to load releases data: {error.detail || error.title}
              </p>
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
          <h1>Release management</h1>
          <p className="u-text--muted">No releases data available.</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="p-section">
        <ReleaseForm
          onCancel={hideForm}
          releases={data.releases}
        />
      </div>
    );
  }

  const { releases, status } = data;

  return (
    <div className="p-section">
      <div className="grid-row">
        <h1>Release management</h1>
        <p className="u-text--muted">
          Manage releases data from releases.yaml.
        </p>
      </div>
      <hr className="p-rule" />

      {/* Status Section */}
      <div className="l-releases__status">
        {status.pr_exists ? (
          <>
            <span className="p-chip is-caution">
              <span className="p-chip__value">Release in progress</span>
            </span>
            {status.pr && (
              <a
                href={String(
                  (status.pr as Record<string, unknown>).html_url ?? "#",
                )}
                rel="noopener noreferrer"
                target="_blank"
              >
                Demo link
              </a>
            )}
          </>
        ) : (
          <span className="p-chip">
            <span className="p-chip__value">No release in progress</span>
          </span>
        )}
      </div>
      <hr className="p-rule" />

      {/* Summary Section */}
      <div className="l-releases__summary">
        <p className="p-text--small-caps">Current releases</p>
        <div className="l-releases__summary-grid">
          {Object.entries(releases)
            .filter(
              ([key]) => key !== "checksums",
            )
            .map(([key, category]) => {
              if (!isRecord(category)) return null;
              const version =
                (category.full_version as string) ||
                (category.short_version as string) ||
                (category.version as string) ||
                "";
              const name = (category.name as string) || "";

              return (
                <div className="l-releases__summary-card" key={key}>
                  <p className="p-text--small-caps u-no-margin--bottom">
                    {key.replace(/_/g, " ")}
                  </p>
                  {name && <p className="u-no-margin--bottom"><strong>{name}</strong></p>}
                  {version && (
                    <p className="u-text--muted u-no-margin--bottom">
                      v{version}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </div>
      <hr className="p-rule" />

      {/* Actions */}
      <Button appearance="positive" onClick={() => setShowForm(true)}>
        Create Release
      </Button>
    </div>
  );
};

export default Releases;
