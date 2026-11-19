import EntregadorShell from "./EntregadorShell";

export const instant = false;

export default function EntregadorLayout({ children }: { children: React.ReactNode }) {
  return <EntregadorShell>{children}</EntregadorShell>;
}
