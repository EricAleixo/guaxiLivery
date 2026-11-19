"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputCls } from "./ui";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className">;

/** Campo de senha com botão para mostrar/ocultar. Aceita as mesmas props de um <input>. */
export function PasswordInput({ maxLength = 72, autoComplete = "current-password", ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        className={`${inputCls} pr-12`}
        type={show ? "text" : "password"}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={show}
        className="absolute inset-y-0 right-2 my-auto grid h-9 w-9 place-items-center rounded-full text-fur hover:bg-orange-soft hover:text-ink"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
