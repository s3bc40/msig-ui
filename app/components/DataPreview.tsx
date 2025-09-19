import { useState } from "react";

export function DataPreview({ value }: { value: string }) {
  const [showAll, setShowAll] = useState(false);
  const MAX_LEN = 80;
  if (!value) return <span className="text-gray-400">-</span>;
  if (showAll || value.length <= MAX_LEN) {
    return (
      <span className="max-w-[60%] break-words whitespace-pre-wrap">
        {value}
        {value.length > MAX_LEN && (
          <button
            className="btn btn-xs btn-link ml-2"
            type="button"
            onClick={() => setShowAll(false)}
          >
            less
          </button>
        )}
      </span>
    );
  }
  return (
    <span className="max-w-[60%] truncate">
      {value.slice(0, MAX_LEN)}...
      <button
        className="btn btn-xs btn-link ml-2"
        type="button"
        onClick={() => setShowAll(true)}
      >
        more
      </button>
    </span>
  );
}
