import { MedicalShopsDiscovery } from "@/components/medical-shops/medical-shops-discovery";
import { medicalShopService } from "@/services";

export const dynamic = "force-dynamic";

interface MedicalShopsPageProps {
  searchParams?: Promise<{
    city?: string;
    state?: string;
    area?: string;
    page?: string;
  }>;
}

const toPositivePage = (value?: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }
  return Math.floor(parsed);
};

export default async function MedicalShopsPage({ searchParams }: MedicalShopsPageProps) {
  const params = (await searchParams) ?? {};
  const currentPage = toPositivePage(params.page);

  const result = await medicalShopService.list({
    city: params.city?.trim() || undefined,
    state: params.state?.trim() || undefined,
    area: params.area?.trim() || undefined,
    page: currentPage,
    limit: 9,
  });

  const createPageHref = (page: number) => {
    const query = new URLSearchParams();
    if (params.city) query.set("city", params.city);
    if (params.state) query.set("state", params.state);
    if (params.area) query.set("area", params.area);
    if (page > 1) query.set("page", String(page));
    const queryString = query.toString();
    return queryString ? `/medical-shops?${queryString}` : "/medical-shops";
  };

  return (
    <MedicalShopsDiscovery
      initialShops={result.data}
      pagination={result.pagination}
      filters={{
        city: params.city,
        state: params.state,
        area: params.area,
      }}
      createPageHref={createPageHref}
    />
  );
}
