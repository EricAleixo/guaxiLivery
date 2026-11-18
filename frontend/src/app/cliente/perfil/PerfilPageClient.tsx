"use client";
import { Loading } from "@/components/Loading";
import { ProfileForm } from "@/components/ProfileForm";
import { useRequireRole } from "@/lib/auth";

export default function PerfilPageClient() {
  const { user } = useRequireRole("CLIENTE");
  if (!user) return <Loading />;
  return (
    <div className="mx-auto max-w-[90rem] space-y-6 px-4 py-8 sm:px-8">
      <h1 className="text-3xl font-extrabold">Meu perfil</h1>
      <ProfileForm />
    </div>
  );
}
