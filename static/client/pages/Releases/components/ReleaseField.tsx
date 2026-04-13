import { type ReactNode, useCallback } from "react";

import { Input } from "@canonical/react-components";
import classNames from "classnames";

import TaggedFieldInput from "./TaggedFieldInput";
import { formatInputLabel, recurseEqual } from "../utils";

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
  if (isTaggedField(val)) return val.value !== null && val.value !== undefined ? String(val.value) : null;
  return null;
}

const ReleaseField = ({ fieldKey, value, originalValue, onChange, showHelpText = false }: IReleaseFieldProps): ReactNode => {
  const isDirty = !recurseEqual(value, originalValue);
  const label = formatInputLabel(fieldKey);
  const helpText = showHelpText ? formatHelpText(originalValue) : null;

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
          <span className="p-chip is-dense u-no-margin--bottom">
            <span className="p-chip__value">{value.type}</span>
          </span>
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
        <Input label={formatInputLabel(label)} onChange={(e) => onChange(Number(e.target.value))} type="number" value={value} />
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
