"use client";

import Link from "next/link";
import { AnimatePresence, MotionConfig, animate, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ElementType } from "@/lib/saju/types";

export interface LandingCharacter {
  nickname: string;
  element: ElementType;
}

export interface LandingHobby {
  name: string;
  slug: string;
  category: string;
  shortCopy: string;
  starterGuide: string;
}

export interface LandingCategory {
  name: string;
  hobbies: LandingHobby[];
}

interface LandingProps {
  characters: LandingCharacter[];
  categories: LandingCategory[];
}

const HOBBY_EMOJI: Record<string, string> = {
  running: "🏃",
  climbing: "🧗",
  swimming: "🏊",
  "yoga-pilates": "🧘",
  "reading-writing": "📚",
  "boardgame-chess": "♟️",
  "coding-maker": "💻",
  "foreign-language": "🌏",
  drawing: "🎨",
  instrument: "🎸",
  "photo-video": "📷",
  "pottery-craft": "🏺",
};

const CATEGORY_EMOJI: Record<string, string> = { 운동형: "💪", 지능형: "🧠", 예술형: "✨" };

const ELEMENTS: { key: ElementType; label: string; demo: number }[] = [
  { key: "wood", label: "목", demo: 32 },
  { key: "fire", label: "화", demo: 24 },
  { key: "earth", label: "토", demo: 18 },
  { key: "metal", label: "금", demo: 14 },
  { key: "water", label: "수", demo: 12 },
];

/** 결과 예시 카드에 보여줄 가상의 순위 */
const SAMPLE_RANKS = [
  { slug: "climbing", score: 92.4 },
  { slug: "yoga-pilates", score: 88.1 },
  { slug: "running", score: 85.7 },
];

const ease = [0.22, 1, 0.36, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

/** 화면에 들어올 때 아래에서 떠오르는 구역 */
function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.section>
  );
}

function CtaButton({ children }: { children: React.ReactNode }) {
  return (
    <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
      <Link href="/saju/input" className="sj-btn sj-btn-lg">
        {children}
      </Link>
    </motion.span>
  );
}

/** 히어로: 취미 카드가 한 장씩 넘어가는 카드 더미 */
function HobbyDeck({ hobbies }: { hobbies: LandingHobby[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % hobbies.length), 2600);
    return () => window.clearInterval(timer);
  }, [hobbies.length]);

  const visible = [0, 1, 2].map((depth) => hobbies[(index + depth) % hobbies.length]);

  return (
    <div className="sj-deck" aria-hidden="true">
      <AnimatePresence initial={false}>
        {visible
          .map((hobby, depth) => (
            <motion.div
              key={hobby.slug}
              className="sj-deck-card"
              initial={{ opacity: 0, y: 60, scale: 0.85 }}
              animate={{ opacity: 1 - depth * 0.25, y: depth * 22, scale: 1 - depth * 0.06, rotate: depth * 2 }}
              exit={{ opacity: 0, x: -120, rotate: -12, transition: { duration: 0.45, ease } }}
              transition={{ duration: 0.55, ease }}
              style={{ zIndex: 3 - depth }}
            >
              <span className="sj-deck-emoji">{HOBBY_EMOJI[hobby.slug] ?? "⭐"}</span>
              <small>{hobby.category}</small>
              <b>{hobby.name}</b>
              <p>{hobby.shortCopy}</p>
            </motion.div>
          ))
          .reverse()}
      </AnimatePresence>
    </div>
  );
}

/** 0에서 목표 점수까지 올라가는 숫자 */
function CountUp({ to, start }: { to: number; start: boolean }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const controls = animate(0, to, { duration: 1.2, ease, onUpdate: (v) => setValue(v) });
    return () => controls.stop();
  }, [start, to]);
  return <>{value.toFixed(1)}</>;
}

/** 실제 결과 화면을 줄여 보여주는 예시 카드 */
function ResultPreview({ bySlug }: { bySlug: Record<string, LandingHobby> }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const top = bySlug[SAMPLE_RANKS[0].slug];

  return (
    <div ref={ref} className="sj-preview">
      <div className="sj-preview-top">
        <span className="sj-preview-badge">나의 1위 취미</span>
        <div className="sj-preview-head">
          <span className="sj-preview-emoji">{HOBBY_EMOJI[top.slug]}</span>
          <div>
            <b>{top.name}</b>
            <small>{top.category}</small>
          </div>
          <strong>
            <CountUp to={SAMPLE_RANKS[0].score} start={inView} />
            <span>점</span>
          </strong>
        </div>
        <p className="sj-preview-guide">{top.starterGuide}</p>
      </div>
      <div className="sj-preview-ranks">
        {SAMPLE_RANKS.slice(1).map((rank, i) => {
          const hobby = bySlug[rank.slug];
          return (
            <motion.div
              key={rank.slug}
              className="sj-preview-rank"
              initial={{ opacity: 0, x: 24 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.5, ease }}
            >
              <span className="sj-preview-no">{i + 2}</span>
              <span>
                {HOBBY_EMOJI[rank.slug]} {hobby.name}
              </span>
              <b>{rank.score.toFixed(1)}</b>
            </motion.div>
          );
        })}
        <div className="sj-preview-more">+ 9개 취미 순위</div>
      </div>
    </div>
  );
}

/** 일간 캐릭터 별칭이 하나씩 바뀌어 나온다 */
function RotatingCharacter({ characters }: { characters: LandingCharacter[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % characters.length), 2400);
    return () => window.clearInterval(timer);
  }, [characters.length]);

  const current = characters[index];
  return (
    <span className="sj-rotator">
      <AnimatePresence mode="wait">
        <motion.span
          key={current.nickname}
          className={`sj-rotator-word el-${current.element}`}
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
          transition={{ duration: 0.4, ease }}
        >
          {current.nickname}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** 스크롤하면 채워지는 예시 오행 막대 */
function DemoBars() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className="sj-demo-bars">
      {ELEMENTS.map((el, i) => (
        <div key={el.key} className={`sj-demo-bar el-${el.key}`}>
          <span>{el.label}</span>
          <div className="sj-demo-track">
            <motion.div
              className="sj-demo-fill"
              initial={{ width: 0 }}
              animate={{ width: inView ? `${el.demo * 2.5}%` : 0 }}
              transition={{ duration: 1, delay: i * 0.1, ease }}
            />
          </div>
          <b>{el.demo}%</b>
        </div>
      ))}
    </div>
  );
}

export default function Landing({ characters, categories }: LandingProps) {
  const allHobbies = categories.flatMap((c) => c.hobbies);
  const bySlug = Object.fromEntries(allHobbies.map((h) => [h.slug, h]));

  return (
    <MotionConfig reducedMotion="user">
      <div className="sj-landing">
        <section className="sj-land-hero">
          <motion.div
            className="sj-land-hero-copy"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.span className="sj-eyebrow" variants={reveal}>
              요즘 뭐 하고 놀지?
            </motion.span>
            <motion.h1 variants={reveal}>
              나한테 딱 맞는 취미,
              <br />
              <em>1분</em>이면 찾아요
            </motion.h1>
            <motion.p className="sj-lead" variants={reveal}>
              12개 취미 중 나에게 맞는 순서대로 알려드려요.
            </motion.p>
            <motion.div variants={reveal} className="sj-land-hero-actions">
              <CtaButton>내 취미 찾기</CtaButton>
              <span className="sj-land-badge">사주 오행 분석 기반 · 가입 없이 무료</span>
            </motion.div>
          </motion.div>
          <HobbyDeck hobbies={allHobbies} />
        </section>

        <Reveal className="sj-land-block">
          <h2>어떤 취미가 있나요?</h2>
          <div className="sj-land-cats">
            {categories.map((c, i) => (
              <motion.div
                key={c.name}
                className="sj-land-cat"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease }}
                whileHover={{ y: -6 }}
              >
                <div className="sj-land-cat-head">
                  <span>{CATEGORY_EMOJI[c.name] ?? "⭐"}</span>
                  <b>{c.name}</b>
                </div>
                <ul>
                  {c.hobbies.map((h) => (
                    <li key={h.slug}>
                      <span aria-hidden="true">{HOBBY_EMOJI[h.slug]}</span> {h.name}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Reveal>

        <Reveal className="sj-land-block sj-land-split">
          <div className="sj-stack" style={{ gap: 12 }}>
            <h2>
              이런 결과를
              <br />
              받아볼 수 있어요
            </h2>
            <p className="sj-lead">1위 취미와 시작 방법, 전체 순위까지.</p>
          </div>
          <ResultPreview bySlug={bySlug} />
        </Reveal>

        <Reveal className="sj-land-block sj-land-split sj-land-how">
          <div className="sj-stack" style={{ gap: 12 }}>
            <span className="sj-eyebrow">어떻게 골라 주나요?</span>
            <h2>사주 속 다섯 기운으로 골라요</h2>
            <p className="sj-lead">
              나의 캐릭터는 <RotatingCharacter characters={characters} />
            </p>
          </div>
          <DemoBars />
        </Reveal>

        <Reveal className="sj-land-cta">
          <h2>나의 1위 취미는 뭘까요?</h2>
          <CtaButton>무료로 시작하기</CtaButton>
        </Reveal>

        <p className="sj-disclaimer sj-center-text">
          재미와 취미 탐색을 위한 서비스예요. 의학적 진단이나 운세 풀이가 아니에요.
        </p>
      </div>
    </MotionConfig>
  );
}
