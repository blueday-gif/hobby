import type { ReactNode } from "react";
import { branchElement, stemElement } from "@/lib/saju/judge";
import type { ResultViewData } from "@/lib/saju/result-store";
import {
  CATEGORY_ORDER,
  CATEGORY_TEMPLATES,
  ELEMENT_KO_LABEL,
  ELEMENT_SHORT_KO,
} from "@/lib/saju/templates";
import { ELEMENT_ORDER, type Pillar, type WellnessGuide } from "@/lib/saju/types";

export type ResultViewMode = "guest" | "member" | "share";

interface ResultViewProps {
  data: ResultViewData;
  mode: ResultViewMode;
  /** 비회원 화면에서 잠긴 순위 위에 올리는 로그인 안내 */
  lockedCta?: ReactNode;
}

function PillarCell({ label, pillar, isDay }: { label: string; pillar: Pillar | null; isDay?: boolean }) {
  if (!pillar) {
    return (
      <div className="sj-pillar is-empty">
        <small>{label}</small>
        <b>미입력</b>
      </div>
    );
  }
  const stemEl = stemElement(pillar.stem);
  const branchEl = branchElement(pillar.branch);
  return (
    <div className={`sj-pillar${isDay ? " is-day" : ""}`}>
      <small>{isDay ? `${label} · 나` : label}</small>
      <b className={`el-${stemEl}`} style={{ color: "var(--el)" }}>
        {pillar.stem}
      </b>
      <b className={`el-${branchEl}`} style={{ color: "var(--el)" }}>
        {pillar.branch}
      </b>
    </div>
  );
}

function WellnessCard({ guide }: { guide: WellnessGuide }) {
  const stateLabel =
    guide.state === "BALANCED" ? "균형" : guide.state === "DEFICIENT" ? "보완이 필요한 기운" : "넘치는 기운";
  return (
    <div className="sj-wellness">
      <div className="sj-chips">
        <span className="sj-chip sj-chip-soft">{stateLabel}</span>
        {guide.targetElement !== "all" && (
          <span className={`sj-chip el-${guide.targetElement}`}>
            <i className="sj-dot" style={{ background: "var(--el)" }} />
            {ELEMENT_KO_LABEL[guide.targetElement]}
          </span>
        )}
      </div>
      <h3>{guide.bodyAxis}</h3>
      <p>{guide.content}</p>
      <div className="sj-chips">
        {guide.careKeywords.map((keyword) => (
          <span key={keyword} className="sj-chip">
            #{keyword}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ResultView({ data, mode, lockedCta }: ResultViewProps) {
  const { dayMaster, elements, topCategory, topHobby, allHobbies } = data;
  const rest = allHobbies.slice(1);

  return (
    <div className="sj-stack">
      {/* 1. 대표 취미 */}
      <section className="sj-card sj-top-hobby sj-stack" style={{ gap: 14 }}>
        <div className="sj-chips">
          <span className="sj-chip sj-chip-soft">나의 1순위 취미</span>
          <span className="sj-chip">{CATEGORY_TEMPLATES[topHobby.category].nameKo}</span>
        </div>
        <h2>{topHobby.name}</h2>
        <p className="sj-lead">{topHobby.shortCopy}</p>
        <div className="sj-score">
          <b>{topHobby.score.toFixed(1)}</b>
          <span className="sj-hint">점 · 적합도</span>
        </div>
        <p>{topHobby.matchReason}</p>
        <p className="sj-starter">
          <b>입문 가이드</b>
          <br />
          {topHobby.starterGuide}
        </p>
      </section>

      {/* 2. 전체 순위 */}
      <section className="sj-card">
        <div className="sj-section-title">
          <h2>12개 취미 전체 순위</h2>
          <span>{mode === "guest" ? "로그인하면 모두 볼 수 있어요" : "항목을 눌러 이유를 확인해 보세요"}</span>
        </div>

        {mode === "guest" ? (
          <div className="sj-locked">
            <div className="sj-rank-list sj-locked-list" aria-hidden="true">
              {rest.slice(0, 5).map((hobby) => (
                <div key={hobby.hobbyId} className="sj-rank">
                  <div className="sj-rank-head">
                    <span className="sj-rank-no">{hobby.rank}</span>
                    <div>
                      <div className="sj-skeleton" style={{ width: "46%" }} />
                      <div className="sj-skeleton" style={{ width: "74%", marginTop: 8 }} />
                    </div>
                    <div className="sj-skeleton" style={{ width: 42 }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="sj-lock-overlay">{lockedCta}</div>
          </div>
        ) : (
          <div className="sj-rank-list">
            {allHobbies.map((hobby) => (
              <details key={hobby.hobbyId} className="sj-rank" open={hobby.rank === 1}>
                <summary>
                  <span className="sj-rank-no">{hobby.rank}</span>
                  <span className="sj-rank-name">
                    <b>{hobby.name}</b>
                    <small>
                      {CATEGORY_TEMPLATES[hobby.category].nameKo} · {ELEMENT_SHORT_KO[hobby.primaryElement]}/
                      {ELEMENT_SHORT_KO[hobby.secondaryElement]}
                    </small>
                  </span>
                  <span className="sj-rank-score">{hobby.score.toFixed(1)}</span>
                </summary>
                <div className="sj-rank-body">
                  <p>{hobby.matchReason}</p>
                  <p className="sj-starter">{hobby.starterGuide}</p>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      {/* 3. 대분류 */}
      <section className="sj-card">
        <div className="sj-section-title">
          <h2>{topCategory.headline}</h2>
          <span>대표 분류 · {topCategory.nameKo}</span>
        </div>
        <p>{topCategory.description}</p>
        <div className="sj-bars" style={{ marginTop: 18 }} role="list" aria-label="대분류 점수">
          {CATEGORY_ORDER.map((category) => (
            <div key={category} className="sj-bar" role="listitem">
              <span className="sj-bar-name">{CATEGORY_TEMPLATES[category].nameKo}</span>
              <div className="sj-bar-track">
                <div
                  className="sj-bar-fill"
                  style={{
                    width: `${Math.min(100, data.categoryScores[category])}%`,
                    background: category === topCategory.category ? "var(--sj-accent)" : "#d1d6db",
                  }}
                />
              </div>
              <b>{data.categoryScores[category].toFixed(1)}%</b>
            </div>
          ))}
        </div>
      </section>

      {/* 4~5. 추천 근거: 사주로 본 나 */}
      <div className="sj-why">
        <span className="sj-eyebrow">왜 이 취미일까요?</span>
        <h2>사주로 본 나</h2>
      </div>

      {/* 4. 일간 캐릭터 */}
      <section className="sj-card sj-character">
        <span className="sj-eyebrow">나의 일간 캐릭터</span>
        <div className={`el-${dayMaster.element}`}>
          <span className="sj-chip">
            <i className="sj-dot" style={{ background: "var(--el)" }} />
            {dayMaster.nameKo}
          </span>
        </div>
        <h2>{dayMaster.nickname}</h2>
        <p>{dayMaster.summary}</p>
        {data.saju && (
          <div className="sj-pillars" aria-label="사주 팔자">
            <PillarCell label="시주" pillar={data.saju.hour} />
            <PillarCell label="일주" pillar={data.saju.day} isDay />
            <PillarCell label="월주" pillar={data.saju.month} />
            <PillarCell label="년주" pillar={data.saju.year} />
          </div>
        )}
      </section>

      {/* 5. 오행 분포 + 웰니스 */}
      <section className="sj-card">
        <div className="sj-section-title">
          <h2>오행 분포와 신체 밸런스</h2>
          <span>
            가장 강한 기운 {ELEMENT_SHORT_KO[data.strongestElement]} · 보완할 기운 {ELEMENT_SHORT_KO[data.weakestElement]}
          </span>
        </div>
        <div className="sj-bars" role="list" aria-label="오행 비율">
          {ELEMENT_ORDER.map((element) => (
            <div key={element} className={`sj-bar el-${element}`} role="listitem">
              <span className="sj-bar-name">
                <i className="sj-dot" />
                {ELEMENT_KO_LABEL[element]}
              </span>
              <div className="sj-bar-track">
                <div className="sj-bar-fill" style={{ width: `${Math.min(100, elements[element])}%` }} />
              </div>
              <b>{elements[element].toFixed(1)}%</b>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <WellnessCard guide={data.wellness.primary} />
          {data.wellness.secondary && <WellnessCard guide={data.wellness.secondary} />}
        </div>
        <p className="sj-disclaimer" style={{ marginTop: 12 }}>
          전통 오행론에 기댄 생활 웰니스 가이드이며 의학적 진단이 아니에요. 몸에 불편이 있다면 전문가와 상담해 주세요.
        </p>
      </section>
    </div>
  );
}
