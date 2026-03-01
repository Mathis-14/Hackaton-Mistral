import TinyInfectionMap from "@/components/TinyInfectionMap";

type TinyMapPageProps = {
    searchParams: Promise<{ computers?: string; centerName?: string }>;
};

export default async function TinyMapPage({ searchParams }: TinyMapPageProps) {
    const params = await searchParams;
    const maxComputers = params.computers
        ? Math.min(16, Math.max(1, parseInt(params.computers, 10) || 3))
        : 3;
    const centerName = params.centerName === "1" || params.centerName === "true";
    return (
        <div className="min-h-screen bg-[#121212]">
            <TinyInfectionMap maxComputers={maxComputers} centerName={centerName} />
        </div>
    );
}
