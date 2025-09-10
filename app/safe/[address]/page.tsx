import SafeInfoClient from "./SafeInfoClient";

export default async function SafeInfoPage({
  params,
}: {
  params: Promise<{ address: `0x${string}` }>;
}) {
  const { address: safeAddress } = await params;

  return <SafeInfoClient safeAddress={safeAddress} />;
}
