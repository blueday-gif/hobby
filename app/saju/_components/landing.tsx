"use client";

import Link from "next/link";
import { AnimatePresence, MotionConfig, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ElementType } from "@/lib/saju/types";

export interface LandingCharacter {
  nickname: string;
  element: ElementType;
}

export interface LandingCategory {
  name: string;
  hobbies: string[];
}

interface LandingProps {
  characters: LandingCharacter[];
  categories: LandingCategory[];
}

const ELEMENTS: { key: ElementType; label: string; demo: number }[] = [
  { key: "wood", label: "목", demo: 32 },
  { key: "fire", label: "화", demo: 24 },
  { key: "earth", label: "토", demo: 18 },
  { key: "metal", label: "금", demo: 14 },
  { key: "water", label: "수", demo: 12 },
];

const STEPS = [
  { no: "01", title: "생년월일시 입력", note: "시간 몰라도 OK" },
  { no: "02", title: "오행 분석", note: "만세력 기반" },
  { no: "03", title: "취미 추천", note: "12개 중 순위" },
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
      viewport={{ once: true, amount: 0.3 }}
    >
      {children}
    </motion.section>
  );
}

/** 오행 다섯 원이 천천히 도는 히어로 그림 */
function ElementOrbit() {
  return (
    <div className="sj-orbit" aria-hidden="true">
      <motion.div
        className="sj-orbit-ring"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {ELEMENTS.map((el, i) => {
          const angle = (i / ELEMENTS.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <motion.span
              key={el.key}
              className={`sj-orbit-dot el-${el.key}`}
              style={{ left: `${50 + Math.cos(angle) * 44}%`, top: `${50 + Math.sin(angle) * 44}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: -360 }}
              transition={{
                scale: { delay: 0.4 + i * 0.12, type: "spring", stiffness: 260, damping: 18 },
                opacity: { delay: 0.4 + i * 0.12 },
                rotate: { duration: 40, repeat: Infinity, ease: "linear" },
              }}
            >
              {el.label}
            </motion.span>
          );
        })}
      </motion.div>
      <motion.div
        className="sj-orbit-core"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        五行
      </motion.div>
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
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease }}
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

/** 취미 이름이 옆으로 흘러가는 띠 */
function HobbyMarquee({ hobbies, reverse }: { hobbies: string[]; reverse?: boolean }) {
  const items = [...hobbies, ...hobbies];
  return (
    <div className="sj-marquee" aria-hidden="true">
      <motion.div
        className="sj-marquee-track"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {items.map((name, i) => (
          <span key={`${name}-${i}`} className="sj-marquee-item">
            {name}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function Landing({ characters, categories }: LandingProps) {
  const allHobbies = categories.flatMap((c) => c.hobbies);
  const half = Math.ceil(allHobbies.length / 2);

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
              사주로 찾는 나의 취미
            </motion.span>
            <motion.h1 variants={reveal}>
              내 사주에 맞는 취미,
              <br />
              <em>1분</em>이면 충분해요
            </motion.h1>
            <motion.p className="sj-lead" variants={reveal}>
              가입 없이 바로 확인해 보세요.
            </motion.p>
            <motion.div variants={reveal}>
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
                <Link href="/saju/input" className="sj-btn sj-btn-lg">
                  내 취미 찾기
                </Link>
              </motion.span>
            </motion.div>
          </motion.div>
          <ElementOrbit />
        </section>

        <Reveal className="sj-land-steps">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.no}
              className="sj-land-step"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6, ease }}
              whileHover={{ y: -4 }}
            >
              <small>{step.no}</small>
              <b>{step.title}</b>
              <span>{step.note}</span>
            </motion.div>
          ))}
        </Reveal>

        <Reveal className="sj-land-block">
          <h2>
            나는 어떤 사람일까?
            <br />
            <RotatingCharacter characters={characters} />
          </h2>
        </Reveal>

        <Reveal className="sj-land-block sj-land-split">
          <h2>
            다섯 가지 기운,
            <br />
            한눈에
          </h2>
          <DemoBars />
        </Reveal>

        <Reveal className="sj-land-block sj-land-hobbies">
          <h2>12개 취미 중 나의 1위는?</h2>
          <div className="sj-land-categories">
            {categories.map((c) => (
              <span key={c.name}>{c.name}</span>
            ))}
          </div>
          <HobbyMarquee hobbies={allHobbies.slice(0, half)} />
          <HobbyMarquee hobbies={allHobbies.slice(half)} reverse />
        </Reveal>

        <Reveal className="sj-land-cta">
          <h2>지금 바로 시작해 보세요</h2>
          <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
            <Link href="/saju/input" className="sj-btn sj-btn-lg">
              무료로 시작하기
            </Link>
          </motion.span>
        </Reveal>

        <p className="sj-disclaimer sj-center-text">
          재미와 취미 탐색을 위한 서비스예요. 의학적 진단이나 운세 풀이가 아니에요.
        </p>
      </div>
    </MotionConfig>
  );
}
