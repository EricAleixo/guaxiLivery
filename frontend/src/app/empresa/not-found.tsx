import { NotFoundView } from "@/components/NotFoundView";

export default function EmpresaNotFound() {
  return (
    <NotFoundView
      title="Não achamos isso no painel"
      message="Esse pedido, produto ou página não existe (ou não é da sua empresa)."
      href="/empresa"
      cta="Voltar ao painel"
    />
  );
}
