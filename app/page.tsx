// import {
//   dehydrate,
//   HydrationBoundary,
//   QueryClient,
// } from "@tanstack/react-query";
import HomePageClient from "./HomePageClient";
// import { getAccount } from "@wagmi/core";
// import { getConfig } from "./config";

export default async function HomePage() {
  // const queryClient = new QueryClient();
  // const config = getConfig();

  // await queryClient.prefetchQuery({
  //   queryKey: ["account", config],
  //   queryFn: () => getAccount(config),
  // });
  return <HomePageClient />;
}
