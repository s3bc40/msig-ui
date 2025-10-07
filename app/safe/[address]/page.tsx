import SafeDashboardClient from "./SafeDashboardClient";

/**
 * SafeInfoPage component that fetches and displays information about a specific safe.
 *
 * @param param0 - The params object containing the safe address.
 * @returns {JSX.Element} The rendered SafeInfoPage component.
 */
export default async function SafeInfoPage({
  params,
}: {
  params: Promise<{ address: `0x${string}` }>;
}) {
  const { address: safeAddress } = await params;

  return <SafeDashboardClient safeAddress={safeAddress} />;
}
