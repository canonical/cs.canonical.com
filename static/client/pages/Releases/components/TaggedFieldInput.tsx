import { type ReactNode, useCallback, useEffect, useState } from "react";

import { Input } from "@canonical/react-components";

import { validateMonthYear, validateRequiredUrl } from "@/pages/Releases/utils";

import { isImageValue } from "@/services/api/types/releases";

interface ITaggedFieldInputProps {
  value: unknown;
  type: string;
  onChange: (newValue: unknown) => void;
}

const TaggedFieldInput = ({ value, type, onChange }: ITaggedFieldInputProps): ReactNode => {
  const [urlDraft, setUrlDraft] = useState<string>(String((isImageValue(value) ? value.url : value) ?? ""));
  const [urlCaution, setUrlCaution] = useState<string | null>(null);
  const [dateDraft, setDateDraft] = useState<string>(String(value ?? ""));
  const [dateCaution, setDateCaution] = useState<string | null>(null);

  useEffect(() => {
    if (type === "image" && isImageValue(value)) {
      setUrlDraft(value.url);
      return;
    }

    if (type === "link") {
      setUrlDraft(String(value ?? ""));
    }

    if (type === "date") {
      setDateDraft(String(value ?? ""));
    }
  }, [type, value]);

  const handleImageChange = useCallback(
    (field: "url" | "width" | "height", fieldValue: string | number) => {
      if (isImageValue(value)) {
        onChange({ ...value, [field]: fieldValue });
      }
    },
    [value, onChange],
  );

  const handleUrlChange = useCallback(
    (nextValue: string, onValid: (validValue: string) => void) => {
      setUrlDraft(nextValue);
      const result = validateRequiredUrl(nextValue);

      if (!result.isValid) {
        setUrlCaution(result.caution ?? "Enter a valid URL.");
        return;
      }

      setUrlCaution(null);
      onValid(result.value ?? nextValue);
    },
    [],
  );

  const handleDateChange = useCallback(
    (nextValue: string) => {
      setDateDraft(nextValue);
      const result = validateMonthYear(nextValue);

      if (!result.isValid) {
        setDateCaution(result.caution ?? "Enter a valid date.");
        return;
      }

      setDateCaution(null);
      onChange(result.value ?? nextValue);
    },
    [onChange],
  );

  if (type === "image" && isImageValue(value)) {
    return (
      <div>
        <Input
          caution={urlCaution ?? undefined}
          label="URL"
          onChange={(e) => handleUrlChange(e.target.value, (validValue) => handleImageChange("url", validValue))}
          placeholder="https://..."
          type="url"
          value={urlDraft}
        />
      </div>
    );
  }

  if (type === "link") {
    return (
      <Input
        caution={urlCaution ?? undefined}
        onChange={(e) => handleUrlChange(e.target.value, onChange)}
        placeholder="https://..."
        type="url"
        value={urlDraft}
      />
    );
  }

  if (type === "date") {
    return (
      <Input
        caution={dateCaution ?? undefined}
        help="e.g., October 2025"
        onChange={(e) => handleDateChange(e.target.value)}
        type="text"
        value={dateDraft}
      />
    );
  }

  // Fallback for any unknown custom type
  return <Input onChange={(e) => onChange(e.target.value)} type="text" value={String(value ?? "")} />;
};

export default TaggedFieldInput;
