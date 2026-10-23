import { getSiteConfig } from "@/lib/config";
import { ConnectPage } from "@/components/connect-page";
export default async function Page() {
  return <ConnectPage config={await getSiteConfig()} />;
}
