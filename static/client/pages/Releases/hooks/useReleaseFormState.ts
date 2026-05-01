import { useCallback, useMemo, useState } from "react";

import { useQueryClient } from "react-query";

import { deepClone, recurseEqual, sortByVersionDesc } from "@/pages/Releases/utils";
import { ReleasesServices } from "@/services/api/services/releases";
import type { IReleasesData, IUpdateReleasesResponse, ReleaseFieldValue } from "@/services/api/types/releases";
import { isRecord } from "@/services/api/types/releases";

type SubmitSuccessHandler = (response: IUpdateReleasesResponse) => void | Promise<void>;
type SubmitErrorHandler = (error: unknown) => void;

interface IUseReleaseFormStateOptions {
  releases: IReleasesData;
  onSubmitSuccess?: SubmitSuccessHandler;
  onSubmitError?: SubmitErrorHandler;
  commitMessage?: string;
}

export interface IUseReleaseFormStateResult {
  formData: IReleasesData;
  setFormData: React.Dispatch<React.SetStateAction<IReleasesData>>;
  isLoading: boolean;
  dirtyCount: number;
  handleFieldChange: (categoryKey: string, fieldKey: string, newValue: ReleaseFieldValue) => void;
  handleChecksumChange: (categoryKey: string, checksumCategory: string, version: string, value: string) => void;
  handleChecksumAdd: (category: string, version: string, hash: string) => void;
  handleChecksumDelete: (category: string, version: string) => void;
  handleSubmit: () => Promise<void>;
}

const DEFAULT_COMMIT_MESSAGE = "Update releases.yaml via ReleaseForm";

export const useReleaseFormState = ({
  releases,
  onSubmitSuccess,
  onSubmitError,
  commitMessage = DEFAULT_COMMIT_MESSAGE,
}: IUseReleaseFormStateOptions): IUseReleaseFormStateResult => {
  const [formData, setFormData] = useState<IReleasesData>(() => deepClone(releases));
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const categoryKey of Object.keys(formData)) {
      const current = formData[categoryKey];
      const original = releases[categoryKey];

      if (isRecord(current) && isRecord(original)) {
        for (const fieldKey of Object.keys(current)) {
          if (!recurseEqual(current[fieldKey], original[fieldKey])) {
            count++;
          }
        }
      }
    }
    return count;
  }, [formData, releases]);

  const handleFieldChange = useCallback((categoryKey: string, fieldKey: string, newValue: ReleaseFieldValue) => {
    setFormData((prev) => {
      const updated = deepClone(prev);
      const category = updated[categoryKey];
      if (isRecord(category)) {
        (category as Record<string, ReleaseFieldValue>)[fieldKey] = newValue;
      }
      return updated;
    });
  }, []);

  const handleChecksumChange = useCallback(
    (categoryKey: string, checksumCategory: string, version: string, value: string) => {
      setFormData((prev) => {
        const updated = deepClone(prev);
        const checksums = updated[categoryKey];

        if (isRecord(checksums)) {
          const checksumGroups = checksums as Record<string, Record<string, string>>;
          if (checksumGroups[checksumCategory]) {
            checksumGroups[checksumCategory][version] = value;
            checksumGroups[checksumCategory] = sortByVersionDesc(checksumGroups[checksumCategory]);
          }
        }

        return updated;
      });
    },
    [],
  );

  const handleChecksumAdd = useCallback((category: string, version: string, hash: string) => {
    setFormData((prev) => {
      const updated = deepClone(prev);
      const checksums = updated.checksums;

      if (isRecord(checksums)) {
        const checksumGroups = checksums as Record<string, Record<string, string>>;
        if (!checksumGroups[category]) {
          checksumGroups[category] = {};
        }
        checksumGroups[category][version] = hash;
        checksumGroups[category] = sortByVersionDesc(checksumGroups[category]);
      }

      return updated;
    });
  }, []);

  const handleChecksumDelete = useCallback((category: string, version: string) => {
    setFormData((prev) => {
      const updated = deepClone(prev);
      const checksums = updated.checksums;

      if (isRecord(checksums)) {
        const checksumGroups = checksums as Record<string, Record<string, string>>;
        if (checksumGroups[category]) {
          delete checksumGroups[category][version];
        }
      }

      return updated;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().toISOString();
      const result = await ReleasesServices.updateReleases(formData, commitMessage + ` [${timestamp}]`);
      await queryClient.invalidateQueries("releases");
      await onSubmitSuccess?.(result.data);
    } catch (error) {
      onSubmitError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [commitMessage, formData, onSubmitError, onSubmitSuccess, queryClient]);

  return {
    formData,
    setFormData,
    isLoading,
    dirtyCount,
    handleFieldChange,
    handleChecksumChange,
    handleChecksumAdd,
    handleChecksumDelete,
    handleSubmit,
  };
};

export default useReleaseFormState;
