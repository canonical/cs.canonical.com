import { type ReactNode, useCallback, useEffect, useState } from "react";

import { Input } from "@canonical/react-components";
import classNames from "classnames";

import TaggedFieldInput from "./TaggedFieldInput";

import { formatInputLabel, recurseEqual, validateRequiredNumber } from "./utils";
import type { ITaggedField, ReleaseFieldValue } from "@/services/api/types/releases";
import { isTaggedField } from "@/services/api/types/releases";

interface IReleaseFieldProps {
  fieldKey: string;
  value: ReleaseFieldValue;
  originalValue: ReleaseFieldValue;
  onChange: (newValue: ReleaseFieldValue) => void;
  showHelpText?: boolean;
}

function formatHelpText(val: ReleaseFieldValue): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val || null;
  if (typeof val === "number") return String(val);
  if (isTaggedField(val)) return formatHelpText(val.value as string);
  if (typeof val === "object") return JSON.stringify(val);
  return null;
}

const ReleaseField = ({
  fieldKey,
  value,
  originalValue,
  onChange,
  showHelpText = false,
}: IReleaseFieldProps): ReactNode => {
  const isDirty = !recurseEqual(value, originalValue);
  const label = formatInputLabel(fieldKey);
  const helpText = showHelpText ? formatHelpText(originalValue) : null;
  const [numberDraft, setNumberDraft] = useState<string>(typeof value === "number" ? String(value) : "");
  const [numberCaution, setNumberCaution] = useState<string | null>(null);

  useEffect(() => {
    if (typeof value === "number") {
      setNumberDraft(String(value));
    }
  }, [value]);

  const handleNumberChange = useCallback(
    (rawValue: string) => {
      setNumberDraft(rawValue);

      const result = validateRequiredNumber(rawValue);
      if (!result.isValid) {
        setNumberCaution(result.caution ?? "Enter a valid numeric value.");
        return;
      }

      setNumberCaution(null);
      onChange(result.value ?? Number(rawValue));
    },
    [onChange],
  );

  const handleTaggedFieldChange = useCallback(
    (newInnerValue: unknown) => {
      if (isTaggedField(value)) {
        const updated: ITaggedField = {
          ...value,
          value: newInnerValue,
        };
        onChange(updated);
      }
    },
    [value, onChange],
  );

  if (isTaggedField(value)) {
    return (
      <div
        className={classNames("l-release-form__field", {
          "is-dirty": isDirty,
        })}
      >
        <div className="l-release-form__field-header">
          <span className="l-release-form__field-label">{formatInputLabel(label)}</span>
        </div>
        <TaggedFieldInput onChange={handleTaggedFieldChange} type={value.type} value={value.value} />
        {helpText && (
          <p className="l-release-form__field-help u-no-margin--bottom">
            Current: <span>{helpText}</span>
          </p>
        )}
      </div>
    );
  }

  if (typeof value === "string") {
    return (
      <div
        className={classNames("l-release-form__field", {
          "is-dirty": isDirty,
        })}
      >
        <Input label={formatInputLabel(label)} onChange={(e) => onChange(e.target.value)} type="text" value={value} />
        {helpText && (
          <p className="l-release-form__field-help u-no-margin--bottom">
            Current: <span>{helpText}</span>
          </p>
        )}
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div
        className={classNames("l-release-form__field", {
          "is-dirty": isDirty,
        })}
      >
        <Input
          caution={numberCaution ?? undefined}
          label={formatInputLabel(label)}
          onChange={(e) => handleNumberChange(e.target.value)}
          type="number"
          value={numberDraft}
        />
        {helpText && (
          <p className="l-release-form__field-help u-no-margin--bottom">
            Current: <span>{helpText}</span>
          </p>
        )}
      </div>
    );
  }

  return null;
};

export default ReleaseField;
