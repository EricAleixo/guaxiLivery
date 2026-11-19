import { NotFoundView } from "@/components/NotFoundView";

export default function ClienteNotFound() {
  return (
    <NotFoundView
      title="Esse prato sumiu do cardápio"
      message="Não encontramos o que você procurava. Que tal dar uma olhada no que está saindo agora?"
      href="/cliente/feed"
      cta="Ver o feed"
    />
  );
}
