export type Strength = { level: 0 | 1 | 2 | 3; label: string; ok: boolean; checks: { label: string; ok: boolean }[] };

export function passwordStrength(pw: string): Strength {
  const checks = [
    { label: "8+ caracteres", ok: pw.length >= 8 },
    { label: "Letra", ok: /[A-Za-z]/.test(pw) },
    { label: "Número", ok: /\d/.test(pw) },
    { label: "Caractere especial", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const ok = checks.every((c) => c.ok); // mínimo exigido (igual ao backend)
  const strong = ok && pw.length >= 12 && /[a-z]/.test(pw) && /[A-Z]/.test(pw);
  if (!pw) return { level: 0, label: "", ok: false, checks };
  if (strong) return { level: 3, label: "Forte", ok, checks };
  if (ok) return { level: 2, label: "Média", ok, checks };
  return { level: 1, label: "Fraca", ok, checks };
}
