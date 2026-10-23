import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import "./water-tank.css";

export const metadata: Metadata = {
  title: "지하 2층 저수조 | 시설ON",
  description: "지하 2층 저수조 설비 정보, 계통도와 점검 기록 예시",
};

const examplePhoto = "예시 사진 · 실제 현장 사진으로 교체 필요";

function SystemDiagram() {
  return (
    <div className="tank-diagram-wrap" role="img" aria-label="급수 계통도 예시: 상수도에서 저수조, 급수 펌프, 건물 급수로 물이 이동하는 흐름">
      <div className="diagram-legend"><span><i className="legend-blue"/>급수 흐름</span><span><i className="legend-gray"/>설비 연결</span></div>
      <svg className="tank-diagram" viewBox="0 0 850 285" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <marker id="flow-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 9 4.5 0 9Z" fill="#5282dc"/></marker>
          <linearGradient id="tank-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ddebff"/><stop offset="1" stopColor="#b8d2ff"/></linearGradient>
        </defs>
        <path d="M143 131H255M424 131H526M692 131H776" stroke="#5282dc" strokeWidth="5" fill="none" markerEnd="url(#flow-arrow)"/>
        <path d="M143 131h112M424 131h102M692 131h84" stroke="#fff" strokeWidth="1.5" strokeDasharray="5 8" fill="none"/>
        <g transform="translate(35 84)"><rect width="108" height="94" rx="12" fill="#f7f9fc" stroke="#dce3ed"/><path d="M23 38h62v34H23zM18 38l36-22 36 22" fill="none" stroke="#7d8ca2" strokeWidth="3" strokeLinejoin="round"/><path d="M34 51h40M34 61h40" stroke="#a9b5c5" strokeWidth="2"/><text x="54" y="115" textAnchor="middle" className="diagram-label">상수도 인입</text><text x="54" y="132" textAnchor="middle" className="diagram-note">예시</text></g>
        <g transform="translate(255 58)"><rect width="169" height="147" rx="15" fill="#f7faff" stroke="#d7e3f5"/><rect x="31" y="23" width="108" height="78" rx="9" fill="url(#tank-fill)" stroke="#6f91c8" strokeWidth="2.5"/><path d="M32 56q27-8 53 0t54 0v36H32Z" fill="#91b5ef" opacity=".7"/><path d="M44 23v-10h82v10M43 101v10h84v-10" fill="none" stroke="#6f91c8" strokeWidth="2.5"/><path d="M22 118h125" stroke="#c4d4eb" strokeWidth="2"/><text x="84" y="132" textAnchor="middle" className="diagram-label">지하 2층 저수조</text><text x="84" y="147" textAnchor="middle" className="diagram-note">용량·구획 확인 필요</text></g>
        <g transform="translate(526 83)"><rect width="166" height="96" rx="12" fill="#f7f9fc" stroke="#dce3ed"/><circle cx="52" cy="47" r="25" fill="#e9effa" stroke="#7c90b1" strokeWidth="2.5"/><path d="M45 34 67 47 45 60Z" fill="#6884b4"/><rect x="82" y="31" width="54" height="32" rx="6" fill="#e9effa" stroke="#7c90b1" strokeWidth="2"/><path d="M93 39h32M93 47h23M93 55h28" stroke="#899bb9" strokeWidth="2"/><text x="83" y="115" textAnchor="middle" className="diagram-label">급수 펌프</text><text x="83" y="132" textAnchor="middle" className="diagram-note">대수·제원 확인 필요</text></g>
        <g transform="translate(776 79)"><rect width="55" height="108" rx="10" fill="#f7f9fc" stroke="#dce3ed"/><path d="M17 17v72M28 17v72M39 17v72M17 33h22M17 54h22M17 76h22" stroke="#93a2b6" strokeWidth="2"/><text x="28" y="126" textAnchor="middle" className="diagram-label">건물 급수</text><text x="28" y="143" textAnchor="middle" className="diagram-note">층별 배관</text></g>
        <path d="M340 205v37h269v-62" stroke="#97a6bc" strokeWidth="2" strokeDasharray="5 5" fill="none"/>
        <rect x="420" y="231" width="130" height="34" rx="17" fill="#f3f5f8"/><text x="485" y="253" textAnchor="middle" className="diagram-note">수위 감지 · 제어반</text>
      </svg>
      <div className="diagram-caption">계통도 예시 · 실제 배관 연결과 제어 방식은 현장 도면 확인 후 수정</div>
    </div>
  );
}

export default async function WaterTankPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: equipment } = await supabase
    .from("equipment")
    .select("id,name,asset_code,location,status,summary,equipment_categories(name)")
    .eq("asset_code", "EX-M-001")
    .maybeSingle();

  if (!equipment) notFound();

  const [specResult, sectionResult, maintenanceResult] = await Promise.all([
    supabase.from("equipment_specs").select("label,value,unit,sort_order").eq("equipment_id", equipment.id).order("sort_order"),
    supabase.from("equipment_sections").select("title,section_type,body,display_order").eq("equipment_id", equipment.id).order("display_order"),
    supabase.from("maintenance_records").select("title,description,status,scheduled_at,completed_at").eq("equipment_id", equipment.id).order("scheduled_at", { ascending: false }),
  ]);

  const categoryRelation = equipment.equipment_categories;
  const equipmentCategory = Array.isArray(categoryRelation) ? categoryRelation[0]?.name : categoryRelation?.name;
  const specs = specResult.data ?? [];
  const sections = sectionResult.data ?? [];
  const maintenanceRecords = maintenanceResult.data ?? [];
  const sectionBody = (title: string) => sections.find((section) => section.title === title)?.body;
  const statusLabel = { normal: "정상", caution: "주의", alarm: "알람", offline: "오프라인" }[equipment.status] ?? equipment.status;

  return (
    <main className="tank-page">
      <header className="tank-topbar">
        <Link className="tank-brand" href="/"><span className="tank-brand-mark"><i/><i/><i/><i/></span><strong>시설ON</strong></Link>
        <div className="tank-top-meta"><span>성수 더스퀘어</span><span className="top-meta-divider"/><span>시설관리 포털</span><span className="mini-profile">김</span></div>
      </header>

      <div className="tank-container">
        <nav className="tank-breadcrumb" aria-label="현재 위치"><Link href="/">대시보드</Link><span>›</span><Link href="/#equipment">시설물 정보</Link><span>›</span><span>기계설비</span><span>›</span><strong>지하 2층 저수조</strong></nav>

        <div className="example-notice"><span>예시 페이지</span>화면 구조 확인을 위한 샘플입니다. 용량, 설비 제원, 점검 내용은 실제 현장 자료로 교체해 주세요.</div>

        <section className="tank-hero">
          <div className="tank-hero-copy"><div className="tank-overline"><span className="tank-status-dot"/> {equipmentCategory ?? "시설 설비"} <span className="tank-overline-sep">/</span> 설비 상세</div><h1>{equipment.name}</h1><p>{equipment.summary ?? "설비 설명이 등록되지 않았습니다."}</p><div className="tank-tags"><span>관리번호 {equipment.asset_code ?? "미입력"}</span><span>위치 {equipment.location || "미입력"}</span><span className="tank-state">● {statusLabel} <small>DB 상태</small></span></div></div>
          <a className="hero-photo" href="https://lfiit.com/products/detail.php?product_id=2045" target="_blank" rel="noreferrer" aria-label="참고용 저수조 사진 출처 열기"><Image src="https://lfiit.com/upload/save_image/608ce8254d05a.JPG" alt="지하 설비실에 설치된 원통형 저수조와 배관의 참고 사진" fill sizes="(max-width: 680px) 100vw, 40vw" priority unoptimized/><span className="hero-photo-label">참고용 사진 · 출처 보기 ↗</span></a>
        </section>

        <div className="tank-layout">
          <article className="tank-article">
            <section className="tank-content-section" id="overview"><div className="tank-section-number">01</div><div className="tank-section-body"><div className="tank-section-kicker">OVERVIEW</div><h2>설비 개요</h2><p>{sectionBody("설비 개요") ?? equipment.summary ?? "설비 개요가 아직 등록되지 않았습니다."}</p><div className="spec-table">{specs.length ? specs.map((spec) => <div key={`${spec.label}-${spec.sort_order}`}><span>{spec.label}</span><strong>{spec.value || "미입력"}{spec.unit && <small> {spec.unit}</small>}</strong></div>) : <div><span>제원</span><strong>등록된 제원이 없습니다.</strong></div>}</div><div className="inline-note"><b>DB 연결</b><span>{sections.length}개 콘텐츠 섹션 · 제원 {specs.length}개 · 점검 이력 {maintenanceRecords.length}건</span></div></div></section>

            <section className="tank-content-section" id="operation"><div className="tank-section-number">02</div><div className="tank-section-body"><div className="tank-section-kicker">HOW IT WORKS</div><h2>급수 흐름과 작동 원리</h2><p>{sectionBody("작동 원리") ?? "작동 원리 설명이 아직 DB에 등록되지 않았습니다."}</p><div className="operation-steps"><div><b>01</b><strong>저장</strong><span>인입 수량과 수위 감시</span></div><i>→</i><div><b>02</b><strong>감지</strong><span>수위 신호를 제어반에 전달</span></div><i>→</i><div><b>03</b><strong>급수</strong><span>펌프를 통해 건물로 공급</span></div></div></div></section>

            <section className="tank-content-section" id="diagram"><div className="tank-section-number">03</div><div className="tank-section-body"><div className="tank-section-kicker">SYSTEM DIAGRAM</div><h2>계통도</h2><p>물의 흐름과 주요 장비 간 연결 관계를 한눈에 보는 예시입니다. 실제 계통도 이미지가 있으면 이 영역에 첨부해 상세 주석과 함께 확인할 수 있습니다.</p><SystemDiagram/></div></section>

            <section className="tank-content-section" id="photos"><div className="tank-section-number">04</div><div className="tank-section-body"><div className="tank-section-kicker">FIELD PHOTOS</div><h2>현장 사진</h2><p>설비 전경과 명판, 밸브·센서 등 점검 지점을 사진으로 남깁니다. 사진을 선택하면 원본 출처로 이동합니다.</p><div className="photo-grid"><figure><a href="https://lfiit.com/products/detail.php?product_id=2045" target="_blank" rel="noreferrer"><Image src="https://lfiit.com/upload/save_image/608ce8254d05a.JPG" alt="저수조와 연결 배관이 보이는 설비실 참고 사진" fill sizes="(max-width: 680px) 100vw, 36vw" unoptimized/></a><figcaption><span>설비실 참고 사진</span><small>출처: LFIIT · {examplePhoto}</small></figcaption></figure><figure><a href="https://www.sanyosoubi.co.jp/20250625125344" target="_blank" rel="noreferrer"><Image src="https://www.sanyosoubi.co.jp/library/599a4b84cbbc1f366d6f6c8a/682e9392a9743342194011e7.jpg" alt="펌프와 저수조, 배관이 설치된 기계실 참고 사진" fill sizes="(max-width: 680px) 100vw, 36vw" unoptimized/></a><figcaption><span>펌프·배관 배치 참고 사진</span><small>출처: Inside三洋装備 · {examplePhoto}</small></figcaption></figure></div><div className="photo-upload-hint"><span>＋</span><div><strong>현장 사진을 추가할 자리</strong><small>전경 · 명판 · 수위 센서 · 급수 펌프 · 밸브류</small></div></div></div></section>

            <section className="tank-content-section" id="inspection"><div className="tank-section-number">05</div><div className="tank-section-body"><div className="tank-section-kicker">INSPECTION GUIDE</div><h2>점검 항목 예시</h2><p>아래 항목은 화면 구조 예시입니다. 점검 주기와 판정 기준은 현장 절차서 및 적용 기준을 확인해 등록합니다.</p><div className="checklist"><div><span className="check-square"/><strong>저수조 외관 및 주변 누수 흔적 확인</strong><em>주기 미설정</em></div><div><span className="check-square"/><strong>수위 표시와 경보 신호 확인</strong><em>주기 미설정</em></div><div><span className="check-square"/><strong>급수 펌프 운전 상태와 이상음 확인</strong><em>주기 미설정</em></div><div><span className="check-square"/><strong>밸브·배관 연결부 누수 확인</strong><em>주기 미설정</em></div></div></div></section>

            <section className="tank-content-section last-section" id="history"><div className="tank-section-number">06</div><div className="tank-section-body"><div className="tank-section-kicker">MAINTENANCE LOG</div><h2>점검·수리 이력</h2><p>점검 기록은 Supabase의 maintenance_records 테이블을 조회합니다.</p>{maintenanceRecords.length ? maintenanceRecords.map((record) => <div className="history-empty" key={`${record.title}-${record.scheduled_at}`}><span>•</span><div><strong>{record.title}</strong><small>{record.description ?? "상세 내용 없음"} · {record.completed_at ?? record.scheduled_at ?? "날짜 미정"}</small></div></div>) : <div className="history-empty"><span>i</span><div><strong>등록된 이력이 없습니다</strong><small>DB에 첫 점검·수리 기록을 추가하면 이곳에 표시됩니다.</small></div></div>}</div></section>
          </article>

          <aside className="tank-aside">
            <div className="aside-card contents-card"><h3>페이지 목차</h3><a href="#overview">설비 개요</a><a href="#operation">작동 원리</a><a href="#diagram">계통도</a><a href="#photos">현장 사진</a><a href="#inspection">점검 항목</a><a href="#history">점검·수리 이력</a></div>
            <div className="aside-card info-card"><div className="aside-card-heading"><span>설비 정보</span><button type="button" aria-label="설비 정보 수정">···</button></div><div><small>담당 부서</small><strong>미입력</strong></div><div><small>최근 확인</small><strong>미입력</strong></div><div><small>운영 상태</small><strong className="aside-status"><i/> 정상 <em>예시</em></strong></div><a href="#overview">정보 확인 항목 <span>↗</span></a></div>
            <div className="aside-card docs-card" id="documents"><span className="docs-icon">▤</span><h3>도면 및 매뉴얼</h3><p>준공도면, 장비 매뉴얼, 점검표를 이곳에 연결합니다.</p><button type="button">첨부 파일 등록 <span>＋</span></button></div>
            <div className="source-card"><span>사진 출처</span><a href="https://lfiit.com/products/detail.php?product_id=2045" target="_blank" rel="noreferrer">LFIIT · 저수조 설비실 ↗</a><a href="https://www.sanyosoubi.co.jp/20250625125344" target="_blank" rel="noreferrer">Inside三洋装備 · 기계실 ↗</a></div>
          </aside>
        </div>
        <footer className="tank-footer"><Link href="/">← 대시보드로 돌아가기</Link><span>시설ON · 저수조 상세 템플릿 예시</span></footer>
      </div>
    </main>
  );
}
