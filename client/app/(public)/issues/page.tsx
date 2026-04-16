import Link from "next/link";
import { Plus, Siren } from "lucide-react";

import { PublicIssuesFeed } from "@/components/issues/public-issues-feed";
import { IssueCard } from "@/components/issues/issue-card";
import { IssueFilters } from "@/components/issues/issue-filters";
import { IssuesPagination } from "@/components/issues/issues-pagination";
import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/ui/section-heading";
import { issueService } from "@/services";

export const dynamic = "force-dynamic";

interface IssuesPageProps {
  searchParams?: Promise<{
    status?: "open" | "in-progress" | "resolved";
    issueType?: "public-help" | "equipment-shortage" | "ambulance-request" | "general";
    roleType?: "patient" | "hospital";
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

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const params = (await searchParams) ?? {};
  const currentPage = toPositivePage(params.page);

  const result = await issueService.list({
    status: params.status,
    issueType: params.issueType,
    roleType: params.roleType,
    page: currentPage,
    limit: 9,
  });

  const createPageHref = (page: number) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.issueType) query.set("issueType", params.issueType);
    if (params.roleType) query.set("roleType", params.roleType);
    if (page > 1) query.set("page", String(page));
    const queryString = query.toString();
    return queryString ? `/issues?${queryString}` : "/issues";
  };

  return (
    <PublicIssuesFeed
      initialIssues={result.data}
      pagination={result.pagination}
      filters={{
        status: params.status,
        issueType: params.issueType,
        roleType: params.roleType,
      }}
      createPageHref={createPageHref}
    />
  );
}
