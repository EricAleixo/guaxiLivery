import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import ProdutoPageClient from "./ProdutoPageClient";

export const instant = false;

export default function ProdutoPage() {
  return <Suspense fallback={<Loading />}><ProdutoPageClient /></Suspense>;
}
