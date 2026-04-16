import { ChatRoom } from "@/components/chat/chat-room";

interface PublicChatPageProps {
  searchParams?: Promise<{ room?: string }>;
}

export default async function PublicChatPage({ searchParams }: PublicChatPageProps) {
  const params = await searchParams;
  const roomId = params?.room || "patient-support-room";

  return (
    <ChatRoom
      title="Patient and support chat"
      description="Use room-based chat to coordinate with hospitals, ask for updates, and share media when needed."
      defaultRoomId={roomId}
      allowedRoles={["patient", "hospital_admin", "doctor"]}
    />
  );
}
