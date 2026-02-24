import { type ReactNode, useCallback } from "react";

import { Input } from "@canonical/react-components";
import classNames from "classnames";

import TaggedFieldInput from "./TaggedFieldInput";
import { recurseEqual } from "./utils";

import type { ITaggedField, ReleaseFieldValue } from "@/services/api/types/releases";
import { isTaggedField } from "@/services/api/types/releases";

interface IReleaseFieldProps {
  fieldKey: string;
  value: ReleaseFieldValue;
  originalValue: ReleaseFieldValue;
  onChange: (newValue: ReleaseFieldValue) => void;
}

const ReleaseField = ({ fieldKey, value, originalValue, onChange }: IReleaseFieldProps): ReactNode => {
  const isDirty = !recurseEqual(value, originalValue);
  const label = fieldKey;

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
          <span className="l-release-form__field-label">{label}</span>
          <span className="p-chip is-dense">
            <span className="p-chip__value">{value.type}</span>
          </span>
        </div>
        <TaggedFieldInput onChange={handleTaggedFieldChange} type={value.type} value={value.value} />
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
        <Input label={label} onChange={(e) => onChange(e.target.value)} type="text" value={value} />
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
        <Input label={label} onChange={(e) => onChange(Number(e.target.value))} type="number" value={value} />
      </div>
    );
  }

  return null;
};

export default ReleaseField;
