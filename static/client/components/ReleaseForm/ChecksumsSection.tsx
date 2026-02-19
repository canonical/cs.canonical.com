import { type ReactNode, useCallback } from "react";

import { Accordion, Textarea } from "@canonical/react-components";
import classNames from "classnames";

import { deepEqual } from "./utils";

interface IChecksumsSectionProps {
  data: Record<string, Record<string, string>>;
  originalData: Record<string, Record<string, string>>;
  onChange: (category: string, version: string, value: string) => void;
}

const ChecksumsSection = ({ data, originalData, onChange }: IChecksumsSectionProps): ReactNode => {
  const handleChange = useCallback(
    (category: string, version: string, value: string) => {
      onChange(category, version, value);
    },
    [onChange],
  );

  const sections = Object.entries(data).map(([category, versions]) => ({
    key: category,
    title: category,
    content: (
      <div className="l-release-form__checksums-category">
        {Object.entries(versions).map(([version, checksum]) => {
          const originalChecksum = originalData?.[category]?.[version];
          const isDirty = !deepEqual(checksum, originalChecksum);

          return (
            <div
              className={classNames("l-release-form__field", {
                "is-dirty": isDirty,
              })}
              key={`${category}-${version}`}
            >
              <Textarea
                grow
                label={version}
                onChange={(e) => handleChange(category, version, e.target.value)}
                value={checksum}
              />
            </div>
          );
        })}
      </div>
    ),
  }));

  return <Accordion sections={sections} />;
};

export default ChecksumsSection;
