"use client";
import { ProfileForm } from "@/components/ProfileForm";

export default function PerfilPageClient() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold">Perfil da empresa</h1>
        <p className="text-fur">É assim que os clientes veem você no feed.</p>
      </header>
      <ProfileForm />
    </div>
  );
}
