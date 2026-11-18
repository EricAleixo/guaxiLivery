import type { Review } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { Avatar } from "./Avatar";
import { Stars } from "./Stars";

export function ReviewItem({ r, showProduct }: { r: Review; showProduct?: boolean }) {
  return (
    <article className="flex gap-3 rounded-2xl border-2 border-fur-light bg-paper p-4">
      <Avatar url={r.clientAvatarUrl} name={r.clientName} className="h-10 w-10" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-extrabold">{r.clientName}</p>
          <Stars value={r.rating} />
          <span className="text-xs text-fur">{timeAgo(r.createdAt)}</span>
        </div>
        {showProduct && <p className="text-xs font-bold text-orange-dark">{r.productName}</p>}
        {r.comment ? <p className="whitespace-pre-line text-sm text-ink/80">{r.comment}</p> : <p className="text-sm italic text-fur">Sem comentário.</p>}
      </div>
    </article>
  );
}
