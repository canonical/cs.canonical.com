import { type ReactNode, useCallback, useMemo, useState } from "react";

import { Accordion, ActionButton, Button } from "@canonical/react-components";
import { useQueryClient } from "react-query";

import ChecksumsSection from "./ChecksumsSection";
import ReleaseField from "./ReleaseField";
import { deepClone, deepEqual, snakeCaseToTitle } from "./utils";

import { ReleasesServices } from "@/services/api/services/releases";
import type { IReleasesData, ReleaseFieldValue } from "@/services/api/types/releases";
import { isRecord, isTaggedField } from "@/services/api/types/releases";

interface IReleaseFormProps {
  releases: IReleasesData;
  onCancel: () => void;
}

function isChecksumData(
  value: unknown,
): value is Record<string, Record<string, string>> {
  if (!isRecord(value)) return false;
  const values = Object.values(value);
  return (
    values.length > 0 &&
    values.every(
      (v) =>
        isRecord(v) &&
        Object.values(v).every((innerV) => typeof innerV === "string"),
    )
  );
}

const ReleaseForm = ({ releases, onCancel }: IReleaseFormProps): ReactNode => {
  const [formData, setFormData] = useState<IReleasesData>(() =>
    deepClone(releases),
  );
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();


  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const categoryKey of Object.keys(formData)) {
      const current = formData[categoryKey];
      const original = releases[categoryKey];

      if (isRecord(current) && isRecord(original)) {  
        for (const fieldKey of Object.keys(current)) {
          if (!deepEqual(current[fieldKey], original[fieldKey])) {
            count++;
          }
        }
      }
    }
    return count;
  }, [formData, releases]);

  const handleFieldChange = useCallback(
    (categoryKey: string, fieldKey: string, newValue: ReleaseFieldValue) => {
      setFormData((prev) => {
        const updated = deepClone(prev);
        const category = updated[categoryKey];
        if (isRecord(category)) {
          (category as Record<string, ReleaseFieldValue>)[fieldKey] = newValue;
        }
        return updated;
      });
    },
    [],
  );

  const handleChecksumChange = useCallback(
    (
      categoryKey: string,
      checksumCategory: string,
      version: string,
      value: string,
    ) => {
      setFormData((prev) => {
        const updated = deepClone(prev);
        const checksums = updated[categoryKey] as Record<
          string,
          Record<string, string>
        >;
        if (checksums[checksumCategory]) {
          checksums[checksumCategory][version] = value;
        }
        return updated;
      });
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      await ReleasesServices.submitRelease(formData);
      await queryClient.invalidateQueries("releases");
      onCancel();
    } catch {
      // Error handling — toast notification can be added here
    } finally {
      setIsLoading(false);
    }
  }, [formData, queryClient, onCancel]);

  const accordionSections = useMemo(() => {
    return Object.entries(formData).map(([categoryKey, categoryData]) => {
      const originalCategoryData = releases[categoryKey];

      // Checksums have a special nested structure
      if (categoryKey === "checksums" && isChecksumData(categoryData)) {
        return {
          key: categoryKey,
          title: snakeCaseToTitle(categoryKey),
          content: (
            <ChecksumsSection
              data={categoryData}
              onChange={(checksumCategory, version, value) =>
                handleChecksumChange(
                  categoryKey,
                  checksumCategory,
                  version,
                  value,
                )
              }
              originalData={
                isChecksumData(originalCategoryData)
                  ? originalCategoryData
                  : ({} as Record<string, Record<string, string>>)
              }
            />
          ),
        };
      }

      // Regular release category
      if (isRecord(categoryData)) {
        return {
          key: categoryKey,
          title: snakeCaseToTitle(categoryKey),
          content: (
            <div className="l-release-form__category">
              {Object.entries(categoryData).map(([fieldKey, fieldValue]) => {
                const originalFieldValue = isRecord(originalCategoryData)
                  ? (originalCategoryData[fieldKey] as ReleaseFieldValue)
                  : fieldValue as ReleaseFieldValue;


                return (
                  <ReleaseField
                    fieldKey={fieldKey}
                    key={fieldKey}
                    onChange={(newValue) =>
                      handleFieldChange(categoryKey, fieldKey, newValue)
                    }
                    originalValue={originalFieldValue}
                    value={fieldValue as ReleaseFieldValue}
                  />
                );
              })}
            </div>
          ),
        };
      }

      return null;
    }).filter(Boolean) as { key: string; title: string; content: ReactNode }[];
  }, [formData, releases, handleFieldChange, handleChecksumChange]);

  return (
    <div className="l-release-form">
      <div className="grid-row--50-50">
        <div className="grid-col">
          <h2>Edit Release Data</h2>
        </div>
        <div className="grid-col u-align--right">
          {dirtyCount > 0 && (
            <span className="p-chip is-information">
              <span className="p-chip__value">
                {dirtyCount} field{dirtyCount !== 1 ? "s" : ""} modified
              </span>
            </span>
          )}
        </div>
      </div>
      <hr className="p-rule" />
      <Accordion sections={accordionSections} />
      <hr className="p-rule" />
      <div className="l-release-form__actions">
        <Button onClick={onCancel}>Cancel</Button>
        <ActionButton
          appearance="positive"
          disabled={dirtyCount === 0}
          loading={isLoading}
          onClick={handleSubmit}
        >
          Submit Release
        </ActionButton>
      </div>
    </div>
  );
};

export default ReleaseForm;
