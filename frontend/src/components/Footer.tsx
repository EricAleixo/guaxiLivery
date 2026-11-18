import { Raccoon } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-fur-light px-4 py-6 text-center sm:mt-16 sm:py-8 text-sm text-fur">
      <p className="flex flex-wrap items-center justify-center gap-2">
        <Raccoon className="h-6 w-6" /> GuaxiLivery — entrega rápida, esperta e noturna.
      </p>
      <p className="mt-1">Feito com fome e carinho</p>
    </footer>
  );
}
