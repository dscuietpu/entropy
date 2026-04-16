import { AssistantChat } from "@/components/assistant/assistant-chat";

interface AssistantPageProps {
  searchParams?: Promise<{
    context?: string;
  }>;
}

export default async function AssistantPage({ searchParams }: AssistantPageProps) {
  const params = await searchParams;

  return <AssistantChat initialContext={params?.context ?? ""} />;
}
