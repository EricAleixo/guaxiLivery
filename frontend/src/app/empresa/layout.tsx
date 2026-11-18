import EmpresaShell from "./EmpresaShell";

// O painel depende de dados do cliente (auth + polling), então não há
// navegação instantânea a validar neste segmento.
export const instant = false;

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  return <EmpresaShell>{children}</EmpresaShell>;
}
