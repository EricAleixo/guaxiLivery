import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import ChatsPageClient from "./ChatsPageClient";

export const instant = false;

export default function ChatsPage() {
  return <Suspense fallback={<Loading />}><ChatsPageClient /></Suspense>;
}
