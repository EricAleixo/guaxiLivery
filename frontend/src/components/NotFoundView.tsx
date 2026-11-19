import Link from "next/link";
import { Home } from "lucide-react";
import { RaccoonLost } from "./Logo";

/** Página 404 com o guaxinim perdido entre os dois 4. */
export function NotFoundView({
  title = "Esse endereço não existe",
  message = "O guaxinim rodou a cidade inteira e não achou a página que você procurava. Talvez o pedido tenha sido entregue em outro lugar.",
  href = "/",
  cta = "Voltar pro início",
}: {
  title?: string;
  message?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mx-auto grid max-w-2xl place-items-center gap-4 px-4 py-14 text-center sm:py-20">
      <div className="flex items-center justify-center gap-1 sm:gap-3" aria-label="Erro 404">
        <span aria-hidden className="font-display text-8xl font-extrabold leading-none text-orange sm:text-9xl">4</span>
        <RaccoonLost className="h-28 w-28 sm:h-40 sm:w-40" />
        <span aria-hidden className="font-display text-8xl font-extrabold leading-none text-orange sm:text-9xl">4</span>
      </div>
      <h1 className="animate-pop text-3xl font-extrabold sm:text-4xl">{title}</h1>
      <p className="animate-pop max-w-md font-semibold text-fur">{message}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link href={href} className="inline-flex items-center gap-2 rounded-full bg-orange px-5 py-3 font-extrabold text-white hover:bg-orange-dark">
          <Home size={18} /> {cta}
        </Link>
      </div>
    </div>
  );
}
