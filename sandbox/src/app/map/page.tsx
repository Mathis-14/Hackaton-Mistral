import InfectionMap from "@/components/InfectionMap";

type MapPageProps = {
  searchParams: Promise<{ computers?: string; centerName?: string }>;
};

export default async function MapPage({ searchParams }: MapPageProps) {
  const params = await searchParams;
  const maxComputers = params.computers
    ? Math.min(16, Math.max(1, parseInt(params.computers, 10) || 3))
    : 3;
  const centerName = params.centerName !== "0" && params.centerName !== "false";
  return <InfectionMap maxComputers={maxComputers} centerName={centerName} />;
}
