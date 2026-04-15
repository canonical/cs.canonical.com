import { type ReactNode } from "react";

import { useOutletContext } from "react-router-dom";

import type { IReleasesLayoutOutletContext } from "./ReleasesLayout";
import ReleaseField from "./components/ReleaseField";
import { formatSectionTitle } from "./utils";

import type { ReleaseFieldValue } from "@/services/api/types/releases";
import { isRecord } from "@/services/api/types/releases";

const UpdateReleasesPage = (): ReactNode => {
  const { formData, data, handleFieldChange } = useOutletContext<IReleasesLayoutOutletContext>();
  const originalReleases = data.releases;

  const releaseCategories = Object.entries(formData).filter(([key]) => key !== "checksums");

  return (
    <div className="l-update-releases">
      {releaseCategories.map(([categoryKey, categoryData]) => {
        if (!isRecord(categoryData)) return null;
        const originalCategory = originalReleases[categoryKey];

        return (
          <div className="l-update-releases__section grid-row" key={categoryKey}>
            <hr className="p-rule" />
            <div className="grid-col-1">
              <p className="l-release-form__section-heading p-text--small-caps">{formatSectionTitle(categoryKey)}</p>
            </div>
            <div className="grid-col-4">
              <div className="l-release-form__category">
                {Object.entries(categoryData).map(([fieldKey, fieldValue]) => {
                  const originalFieldValue = isRecord(originalCategory)
                    ? (originalCategory[fieldKey] as ReleaseFieldValue)
                    : (fieldValue as ReleaseFieldValue);

                  return (
                    <ReleaseField
                      fieldKey={fieldKey}
                      key={fieldKey}
                      onChange={(newValue) => handleFieldChange(categoryKey, fieldKey, newValue)}
                      originalValue={originalFieldValue}
                      showHelpText
                      value={fieldValue as ReleaseFieldValue}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UpdateReleasesPage;
