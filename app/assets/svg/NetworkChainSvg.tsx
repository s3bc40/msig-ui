/**
 * SVG icon representing a network or blockchain chain.
 *
 * @returns SVG icon representing a network or blockchain chain.
 */
export default function NetworkChainSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 sm:h-6 sm:w-6"
    >
      {/* General network/chain icon: interconnected nodes */}
      <circle cx="5" cy="12" r="3" />
      <circle cx="19" cy="12" r="3" />
      <circle cx="12" cy="5" r="3" />
      <circle cx="12" cy="19" r="3" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="11" y2="12" />
      <line x1="13" y1="12" x2="16" y2="12" />
    </svg>
  );
}
