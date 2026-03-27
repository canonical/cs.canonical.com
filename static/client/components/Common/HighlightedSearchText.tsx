type HighlightedSearchTextProps = {
  text: string;
  highlight: string;
};

const HighlightedSearchText = ({ text, highlight }: HighlightedSearchTextProps) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => (part.toLowerCase() === highlight.toLowerCase() ? <b key={index}>{part}</b> : part))}
    </span>
  );
};

export default HighlightedSearchText;
