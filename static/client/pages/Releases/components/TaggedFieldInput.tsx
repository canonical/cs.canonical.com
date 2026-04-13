import { type ReactNode, useCallback } from "react";

import { Input } from "@canonical/react-components";

import { isImageValue } from "@/services/api/types/releases";

interface ITaggedFieldInputProps {
  value: unknown;
  type: string;
  onChange: (newValue: unknown) => void;
}

const TaggedFieldInput = ({ value, type, onChange }: ITaggedFieldInputProps): ReactNode => {
  const handleImageChange = useCallback(
    (field: "url" | "width" | "height", fieldValue: string | number) => {
      if (isImageValue(value)) {
        onChange({ ...value, [field]: fieldValue });
      }
    },
    [value, onChange],
  );

  if (type === "image" && isImageValue(value)) {
    return (
      <div>
        <Input label="URL" onChange={(e) => handleImageChange("url", e.target.value)} type="url" value={value.url} />
      </div>
    );
  }

  if (type === "link") {
    return (
      <Input
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        type="url"
        value={String(value ?? "")}
      />
    );
  }

  if (type === "date") {
    return (
      <Input
        help="e.g., October 2025"
        onChange={(e) => onChange(e.target.value)}
        type="text"
        value={String(value ?? "")}
      />
    );
  }

  // Fallback for any unknown custom type
  return <Input onChange={(e) => onChange(e.target.value)} type="text" value={String(value ?? "")} />;
};

export default TaggedFieldInput;
