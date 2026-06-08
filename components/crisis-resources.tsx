import { CRISIS_LINES } from "@/lib/crisis";
import { HeartHandshake, Phone } from "lucide-react";

/**
 * 자살·자해 신호가 감지되었을 때 노출하는 위기 상담 자원.
 * 경고하듯이 아니라 따뜻하게, 곁에 있다는 톤으로.
 */
export function CrisisResources() {
  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5">
      <div className="flex items-center gap-2 text-orange-700">
        <HeartHandshake className="h-5 w-5" />
        <h3 className="text-sm font-semibold">혼자가 아니에요</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-dusk">
        지금 많이 힘드시다면, 마음을 나눌 수 있는 곳이 있어요. 언제든 아래로
        연락해 이야기를 들려주세요.
      </p>
      <ul className="mt-4 space-y-2">
        {CRISIS_LINES.map((line) => (
          <li key={line.number}>
            <a
              href={`tel:${line.tel}`}
              className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 ring-1 ring-orange-100 transition hover:bg-white"
            >
              <span className="flex items-center gap-2 text-sm text-dusk">
                <Phone className="h-4 w-4 text-orange-500" />
                {line.name}
              </span>
              <span className="text-right">
                <span className="block text-sm font-semibold text-orange-700">
                  {line.number}
                </span>
                <span className="block text-[11px] text-mist">{line.note}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
