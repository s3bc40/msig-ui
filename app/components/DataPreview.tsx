import { useState } from "react";

export default function DataPreview({ value }: { value: string }) {
  const [showAll, setShowAll] = useState(false);
  const METHOD_SELECTOR_LEN = 10; // 4 bytes + 0x prefix
  const PREVIEW_LEN = 80;
  if (!value) return <span className="text-gray-400">-</span>;
  // Show full value
  if (showAll || value.length <= PREVIEW_LEN) {
    return (
      <div className="w-7/12">
        <span className="break-words whitespace-pre-wrap">
          <b aria-label="The first 4 bytes determine the contract method that is being called">
            {value.slice(0, METHOD_SELECTOR_LEN)}
          </b>
          {value.slice(METHOD_SELECTOR_LEN)}
        </span>
        {value.length > PREVIEW_LEN && (
          <button
            className="btn btn-xs btn-link"
            type="button"
            onClick={() => setShowAll(false)}
          >
            Hide
          </button>
        )}
      </div>
    );
  }
  // Truncated preview
  return (
    <div className="w-7/12">
      <span className="break-words whitespace-pre-wrap">
        <b aria-label="The first 4 bytes determine the contract method that is being called">
          {value.slice(0, METHOD_SELECTOR_LEN)}
        </b>
        {value.slice(METHOD_SELECTOR_LEN, PREVIEW_LEN)}
        <span className="text-gray-400">…</span>
      </span>
      <button
        className="btn btn-xs btn-link"
        type="button"
        onClick={() => setShowAll(true)}
      >
        Show more
      </button>
    </div>
  );
}
