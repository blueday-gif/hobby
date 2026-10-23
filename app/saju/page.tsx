import Link from "next/link";
import {
  CATEGORY_ORDER,
  CATEGORY_TEMPLATES,
  DAY_MASTER_TEMPLATES,
  ELEMENT_SHORT_KO,
  HOBBY_TEMPLATES,
} from "@/lib/saju/templates";

export default function SajuLandingPage() {
  const stems = Object.values(DAY_MASTER_TEMPLATES);

  return (
    <div className="sj-stack">
      <section className="sj-hero">
        <span className="sj-eyebrow">사주 기반 취미 발견 서비스</span>
        <h1>
          내 사주에 맞는 취미,
          <br />
          <em>1분</em>이면 찾아드려요
        </h1>
        <p className="sj-lead">
          생년월일시만 입력하면 만세력으로 오행 분포를 계산해, 나만의 일간 캐릭터와 오행 웰니스 팁,
          운동형·지능형·예술형 취미 순위를 바로 알려드려요. 가입 없이 바로 체험할 수 있어요.
        </p>
        <div className="sj-actions">
          <Link href="/saju/input" className="sj-btn">
            내 사주 취미 찾기
          </Link>
        </div>
      </section>

      <section className="sj-steps" aria-label="이용 방법">
        <div className="sj-step">
          <b>1. 생년월일시 입력</b>
          <p>양력·음력(윤달 포함), 시간을 몰라도 괜찮아요.</p>
        </div>
        <div className="sj-step">
          <b>2. 오행 계산</b>
          <p>만세력으로 사주 팔자를 뽑아 오행 비율을 계산해요.</p>
        </div>
        <div className="sj-step">
          <b>3. 취미 추천</b>
          <p>캐릭터, 웰니스 팁, 12개 취미 중 나에게 맞는 순위를 확인해요.</p>
        </div>
      </section>

      <section className="sj-card">
        <div className="sj-section-title">
          <h2>10가지 일간 캐릭터</h2>
          <span>사주에서 &lsquo;나&rsquo;를 뜻하는 일간으로 정해져요</span>
        </div>
        <div className="sj-grid-2">
          {stems.map((stem) => (
            <div key={stem.stemCode} className={`sj-mini el-${stem.element}`}>
              <small>
                <span className="sj-dot" /> {stem.nameKo} · {ELEMENT_SHORT_KO[stem.element]}
              </small>
              <b>{stem.nickname}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="sj-card">
        <div className="sj-section-title">
          <h2>3가지 분류, 12개 취미</h2>
          <span>운동형 · 지능형 · 예술형</span>
        </div>
        <div className="sj-stack">
          {CATEGORY_ORDER.map((category) => {
            const template = CATEGORY_TEMPLATES[category];
            const hobbies = HOBBY_TEMPLATES.filter((hobby) => hobby.category === category);
            return (
              <div key={category}>
                <h3>
                  {template.nameKo} <span className="sj-hint">· {template.coreElements}</span>
                </h3>
                <div className="sj-chips" style={{ marginTop: 10 }}>
                  {hobbies.map((hobby) => (
                    <span key={hobby.hobbyId} className="sj-chip sj-chip-soft">
                      {hobby.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="sj-actions" style={{ marginTop: 22 }}>
          <Link href="/saju/input" className="sj-btn">
            지금 바로 시작하기
          </Link>
        </div>
      </section>

      <p className="sj-disclaimer">
        사주취미는 재미와 취미 탐색을 위한 서비스이며, 의학적 진단이나 길흉화복 풀이를 제공하지 않아요.
        오행 웰니스 가이드는 생활 습관 참고용이에요.
      </p>
    </div>
  );
}
