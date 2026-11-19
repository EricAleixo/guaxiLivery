export function Raccoon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#ff6a1a" />
      <circle cx="16" cy="22" r="8" fill="#5b534e" /><circle cx="48" cy="22" r="8" fill="#5b534e" />
      <ellipse cx="32" cy="38" rx="22" ry="19" fill="#8c847e" />
      <ellipse cx="32" cy="44" rx="13" ry="10" fill="#f5efe8" />
      <ellipse cx="21" cy="35" rx="8" ry="6" fill="#231c18" /><ellipse cx="43" cy="35" rx="8" ry="6" fill="#231c18" />
      <circle cx="21" cy="35" r="2.6" fill="#fff" /><circle cx="43" cy="35" r="2.6" fill="#fff" />
      <ellipse cx="32" cy="43" rx="3.4" ry="2.5" fill="#231c18" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <Raccoon className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
      <span className="font-display text-xl font-extrabold text-ink sm:text-2xl">Guaxi<span className="text-orange">Livery</span></span>
    </span>
  );
}

/** Guaxinim comendo um lanche: animação só com CSS (ver .rc-* em globals.css). */
export function RaccoonSnacking({ className = "h-40 w-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Guaxinim comendo um lanche">
      <ellipse cx="60" cy="112" rx="34" ry="4" fill="#231c18" opacity=".15" />
      {/* corpo */}
      <ellipse cx="60" cy="96" rx="30" ry="20" fill="#8c847e" />
      <ellipse cx="60" cy="100" rx="17" ry="13" fill="#f5efe8" />
      {/* cauda listrada */}
      <g>
        <path d="M88 98c16-2 22-16 14-26-3 8-9 12-17 14z" fill="#8c847e" />
        <path d="M95 92l5-6M99 86l5-4" stroke="#231c18" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* cabeça */}
      <g className="rc-head">
        <circle cx="30" cy="30" r="11" fill="#5b534e" className="rc-ear" />
        <circle cx="90" cy="30" r="11" fill="#5b534e" className="rc-ear" style={{ animationDelay: ".4s" }} />
        <circle cx="30" cy="30" r="5" fill="#f5efe8" /><circle cx="90" cy="30" r="5" fill="#f5efe8" />
        <ellipse cx="60" cy="52" rx="36" ry="30" fill="#8c847e" />
        <ellipse cx="60" cy="62" rx="20" ry="15" fill="#f5efe8" />
        <ellipse cx="43" cy="48" rx="12" ry="9" fill="#231c18" /><ellipse cx="77" cy="48" rx="12" ry="9" fill="#231c18" />
        <circle cx="43" cy="48" r="4" fill="#fff" /><circle cx="77" cy="48" r="4" fill="#fff" />
        <circle cx="44.5" cy="49" r="1.8" fill="#231c18" /><circle cx="78.5" cy="49" r="1.8" fill="#231c18" />
        <ellipse cx="60" cy="60" rx="5" ry="3.5" fill="#231c18" />
      </g>
      {/* lanche */}
      <g className="rc-snack">
        <g className="rc-bite">
          <path d="M42 84c0-9 8-14 18-14s18 5 18 14z" fill="#e8a33d" />
          <rect x="41" y="84" width="38" height="4" rx="2" fill="#17a673" />
          <rect x="42" y="88" width="36" height="5" rx="2.5" fill="#7a3b1d" />
          <path d="M42 93h36c0 5-8 8-18 8s-18-3-18-8z" fill="#e8a33d" />
          <circle cx="52" cy="76" r="1.2" fill="#fff3d6" /><circle cx="62" cy="73" r="1.2" fill="#fff3d6" /><circle cx="70" cy="77" r="1.2" fill="#fff3d6" />
        </g>
        {/* patinhas segurando */}
        <ellipse cx="41" cy="90" rx="8" ry="6" fill="#231c18" /><ellipse cx="79" cy="90" rx="8" ry="6" fill="#231c18" />
      </g>
      {/* migalhas */}
      <g fill="#e8a33d">
        <circle className="rc-crumb" cx="62" cy="68" r="1.8" />
        <circle className="rc-crumb" cx="68" cy="66" r="1.4" style={{ animationDelay: ".15s" }} />
      </g>
    </svg>
  );
}

/** Guaxinim perdido: olha pros lados e inclina a cabeça (animação só com CSS, ver .rc-look em globals.css). */
export function RaccoonLost({ className = "h-40 w-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Guaxinim perdido">
      <ellipse cx="60" cy="112" rx="30" ry="4" fill="#231c18" opacity=".15" />
      <text x="92" y="22" fontSize="20" fontWeight="800" fill="#ff6a1a" className="rc-q">?</text>
      <text x="14" y="30" fontSize="16" fontWeight="800" fill="#ffc53d" className="rc-q" style={{ animationDelay: ".8s" }}>?</text>
      <text x="100" y="52" fontSize="12" fontWeight="800" fill="#2f80ed" className="rc-q" style={{ animationDelay: "1.6s" }}>?</text>
      <ellipse cx="60" cy="98" rx="26" ry="15" fill="#8c847e" />
      <ellipse cx="60" cy="101" rx="14" ry="10" fill="#f5efe8" />
      <g className="rc-tilt">
        <circle cx="30" cy="34" r="11" fill="#5b534e" className="rc-ear" />
        <circle cx="90" cy="34" r="11" fill="#5b534e" className="rc-ear" style={{ animationDelay: ".4s" }} />
        <circle cx="30" cy="34" r="5" fill="#f5efe8" /><circle cx="90" cy="34" r="5" fill="#f5efe8" />
        <ellipse cx="60" cy="56" rx="36" ry="30" fill="#8c847e" />
        <ellipse cx="60" cy="66" rx="20" ry="15" fill="#f5efe8" />
        <ellipse cx="43" cy="52" rx="12" ry="9" fill="#231c18" /><ellipse cx="77" cy="52" rx="12" ry="9" fill="#231c18" />
        <circle cx="43" cy="52" r="4.5" fill="#fff" /><circle cx="77" cy="52" r="4.5" fill="#fff" />
        <g className="rc-look"><circle cx="43" cy="52.5" r="2.2" fill="#231c18" /><circle cx="77" cy="52.5" r="2.2" fill="#231c18" /></g>
        <ellipse cx="60" cy="64" rx="5" ry="3.5" fill="#231c18" />
        <path d="M54 71q6 -3 12 0" stroke="#231c18" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
