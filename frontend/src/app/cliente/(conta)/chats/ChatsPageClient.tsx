"use client";
import { Loading } from "@/components/Loading";
import { ChatsPage } from "@/components/ChatsPage";
import { useRequireRole } from "@/lib/auth";

export default function ChatsPageClient() {
  const { user } = useRequireRole("CLIENTE");
  if (!user) return <Loading />;
  return (
    <ChatsPage />
  );
}
