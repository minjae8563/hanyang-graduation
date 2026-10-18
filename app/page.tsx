import Link from "next/link";
import { LandingDemo } from "@/components/landing-demo";
import {
  ArrowRight,
  CalendarHeart,
  ClipboardList,
  Feather,
  HeartHandshake,
  Lock,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: Feather,
    title: "마음 기록",
    body: "떠오르는 대로 편하게 적어요. 정해진 형식도, 글자 수 제한도 없어요.",
  },
  {
    icon: Sparkles,
    title: "마음로그의 한마디",
    body: "기록을 저장하면 AI가 글의 결을 살펴보고 따뜻한 한마디를 건네요.",
  },
  {
    icon: ClipboardList,
    title: "오늘의 체크인",
    body: "기분·흥미·기운·수면·집중, 다섯 가지를 버튼 몇 번으로 가볍게 짚어봐요.",
  },
  {
    icon: CalendarHeart,
    title: "2주마다 마음 점검",
    body: "표준 자가설문(PHQ-9)으로 2주마다 마음 상태를 점검하고 흐름을 확인해요.",
  },
];

const STEPS = [
  {
    title: "들어가면 바로 시작",
    body: "회원가입이나 로그인 없이 익명으로 시작돼요. 이 기기에서 쓴 기록은 나만 볼 수 있어요.",
  },
  {
    title: "처음 한 번, 마음 점검",
    body: "첫 방문 때 9문항 설문으로 지금의 마음 상태를 기준점으로 남겨요. 이후엔 2주마다 다시 물어봐요.",
  },
  {
    title: "매일 체크인과 기록",
    body: "하루에 한 번 체크인을 하고, 하고 싶은 말이 있을 땐 자유롭게 적어요. 저장하면 한마디가 돌아와요.",
  },
  {
    title: "쌓일수록 보이는 흐름",
    body: "기록이 쌓이면 지난 기록과 마음의 결을 한눈에 돌아볼 수 있어요.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      {/* 상단 바 */}
      <nav className="flex items-center justify-between py-5">
        <span className="text-base font-semibold tracking-tight text-dusk">
          마음로그
        </span>
        <Link
          href="/app"
          className="text-sm text-sage-700 underline-offset-4 hover:underline"
        >
          바로 기록하기
        </Link>
      </nav>

      {/* 히어로 */}
      <section className="fade-in pb-14 pt-10 sm:pt-16">
        <p className="text-sm text-sage-600">기록으로 살피는 마음 돌봄</p>
        <h1 className="mt-3 text-3xl font-semibold leading-snug tracking-tight text-dusk sm:text-4xl">
          오늘의 마음을 적어두면,
          <br />
          마음의 흐름을 함께 살펴볼게요
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-mist">
          마음로그는 하루의 기록과 가벼운 체크인을 모아 마음의 변화를 돌아보게
          돕는 공간이에요. 잘 쓰려고 애쓰지 않아도 괜찮아요.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-full bg-sage-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sage-700"
          >
            사용하러 가기
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#demo"
            className="rounded-full px-5 py-3 text-sm text-mist ring-1 ring-clay/60 transition hover:bg-white/60"
          >
            먼저 둘러보기
          </a>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-mist">
          <Lock className="h-3.5 w-3.5" />
          로그인 없이 익명으로 시작해요
        </p>
      </section>

      {/* 제공하는 것 */}
      <section className="py-10">
        <h2 className="text-sm font-medium text-mist">마음로그가 하는 일</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-3xl bg-white/70 p-5 shadow-soft ring-1 ring-clay/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-50">
                <Icon className="h-4 w-4 text-sage-600" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-dusk">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mist">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 사용 방법 */}
      <section className="py-10">
        <h2 className="text-sm font-medium text-mist">이렇게 사용해요</h2>
        <ol className="mt-5 space-y-3">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="flex gap-4 rounded-2xl bg-white/60 p-5 ring-1 ring-clay/30"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-600 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-dusk">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-mist">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 데모 */}
      <section id="demo" className="scroll-mt-6 py-10">
        <h2 className="text-sm font-medium text-mist">미리 체험해 보기</h2>
        <p className="mt-1 text-xs text-mist/80">
          예시 화면이에요. 여기서 누른 내용은 저장되지 않아요.
        </p>
        <div className="mt-5">
          <LandingDemo />
        </div>
      </section>

      {/* 안심 안내 */}
      <section className="py-10">
        <div className="rounded-3xl bg-sand/60 p-6">
          <div className="flex items-center gap-2 text-dusk">
            <HeartHandshake className="h-5 w-5 text-sage-600" />
            <h2 className="text-[15px] font-semibold">안심하고 쓸 수 있도록</h2>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-mist">
            <li>· 기록은 익명 계정에 묶여, 다른 사람은 볼 수 없어요.</li>
            <li>
              · 힘든 신호가 보이면 24시간 상담 창구를 함께 안내해요.
            </li>
            <li>
              · 마음로그는 의료적 진단이나 치료를 대신하지 않아요. 점검 결과는
              스스로를 돌아보는 참고용이에요.
            </li>
            <li>
              · 같은 브라우저로 다시 들어와야 이전 기록이 이어져요. 브라우저
              데이터를 지우면 기록을 다시 볼 수 없어요.
            </li>
          </ul>
        </div>
      </section>

      {/* 마지막 CTA */}
      <section className="py-12 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-dusk">
          오늘의 마음, 한 줄부터 시작해 볼까요?
        </h2>
        <Link
          href="/app"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-sage-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sage-700"
        >
          사용하러 가기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="pt-6 text-center text-xs leading-relaxed text-mist/70">
        지금 많이 힘들다면 자살예방 상담전화{" "}
        <a href="tel:109" className="font-medium text-dusk underline">
          109
        </a>{" "}
        (24시간·익명·무료)에서 이야기를 들어줘요.
        <br />
        한양대학교 졸업 프로젝트 · 마음로그
      </footer>
    </main>
  );
}
