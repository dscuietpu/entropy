import { HospitalsDiscovery } from "@/components/hospitals/hospitals-discovery";
import { hospitalService } from "@/services";

export const dynamic = "force-dynamic";

interface HospitalsPageProps {
  searchParams?: Promise<{
    city?: string;
    state?: string;
    availabilityStatus?: "free" | "busy";
    page?: string;
    search?: string;
  }>;
}

const toPositivePage = (value?: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }
  return Math.floor(parsed);
};

export default async function HospitalsPage({ searchParams }: HospitalsPageProps) {
  const params = (await searchParams) ?? {};
  const currentPage = toPositivePage(params.page);
  const search = params.search?.trim() ?? "";

  const result = await hospitalService.list({
    city: params.city?.trim() || undefined,
    state: params.state?.trim() || undefined,
    availabilityStatus: params.availabilityStatus || undefined,
    specialties: search || undefined,
    page: currentPage,
    limit: 9,
  });

  const createPageHref = (page: number) => {
    const query = new URLSearchParams();
    if (params.city) query.set("city", params.city);
    if (params.state) query.set("state", params.state);
    if (params.availabilityStatus) query.set("availabilityStatus", params.availabilityStatus);
    if (search) query.set("search", search);
    if (page > 1) query.set("page", String(page));
    const queryString = query.toString();
    return queryString ? `/hospitals?${queryString}` : "/hospitals";
  };

  return (
    <HospitalsDiscovery
      initialHospitals={result.data}
      pagination={result.pagination}
      filters={{
        city: params.city,
        state: params.state,
        availabilityStatus: params.availabilityStatus,
        search,
      }}
      createPageHref={createPageHref}
    />
  );
}
