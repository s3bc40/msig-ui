import SafeDashboardClient from "./SafeDashboardClient";

export default async function SafeInfoPage({
  params,
}: {
  params: Promise<{ address: `0x${string}` }>;
}) {
  const { address: safeAddress } = await params;

  return <SafeDashboardClient safeAddress={safeAddress} />;
}
