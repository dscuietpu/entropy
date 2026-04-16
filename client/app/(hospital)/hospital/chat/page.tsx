import { ChatRoom } from "@/components/chat/chat-room";

interface HospitalChatPageProps {
  searchParams?: Promise<{ room?: string }>;
}

export default async function HospitalChatPage({ searchParams }: HospitalChatPageProps) {
  const params = await searchParams;
  const roomId = params?.room || "hospital-operations-room";

  return (
    <ChatRoom
      title="Hospital collaboration chat"
      description="Coordinate with patients or other hospitals using one room-based chat surface for updates, handoffs, and media sharing."
      defaultRoomId={roomId}
      allowedRoles={["hospital_admin", "doctor"]}
    />
  );
}
