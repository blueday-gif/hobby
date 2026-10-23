"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";

export type IconName = "grid" | "settings" | "clipboard" | "calendar" | "file" | "search" | "bell" | "chevron" | "arrow" | "water" | "camera" | "fan" | "bolt" | "network" | "fire" | "lift" | "dots" | "clock" | "check";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1.9-1.4 2.4-1.3-.5a7.7 7.7 0 0 1-1.6.9l-.2 1.4h-2.8l-.2-1.4a7.7 7.7 0 0 1-1.6-.9l-1.3.5-1.4-2.4 1.1-.9a7 7 0 0 1 0-1.9l-1.1-.9 1.4-2.4 1.3.5a7.7 7.7 0 0 1 1.6-.9l.2-1.4h2.8l.2 1.4a7.7 7.7 0 0 1 1.6.9l1.3-.5 1.4 2.4-1.1.9a7 7 0 0 1-.1 1.8Z" transform="translate(-1 -1) scale(.95)"/></>,
    clipboard: <><rect x="5" y="4.5" width="14" height="17" rx="2"/><path d="M9 4.5v-1h6v1M8.5 10h7M8.5 14h7M8.5 18h4"/></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/></>,
    file: <><path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 20V5a1.5 1.5 0 0 1 2-1.5Z"/><path d="M14 3.5V8h4M8 13h8M8 17h5"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    water: <><path d="M12 3.5S6 10.2 6 14a6 6 0 0 0 12 0c0-3.8-6-10.5-6-10.5Z"/><path d="M9.5 15.5a2.5 2.5 0 0 0 2.5 2"/></>,
    camera: <><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.3"/></>,
    fan: <><circle cx="12" cy="12" r="2"/><path d="M12 10c-1-3 .1-6 2.5-6 1.8 0 2.4 2 .7 3.4L12 10ZM14 12c3-1 6.1.1 6.1 2.5 0 1.8-2 2.4-3.4.7L14 12ZM12 14c1 3-.1 6-2.5 6-1.8 0-2.4-2-.7-3.4L12 14ZM10 12c-3 1-6.1-.1-6.1-2.5 0-1.8 2-2.4 3.4-.7L10 12Z"/></>,
    bolt: <path d="m13.2 2.5-9 11h6.4l-.8 8 9-11h-6.4l.8-8Z"/>,
    network: <><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-2h12v2M18 14v2"/></>,
    fire: <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-3-10-2 2-3 4-3 6-2-2-3-4-3-7-1 3-5 7-5 11a7 7 0 0 0 7 7Zm0-2a3 3 0 0 1-3-3c0-1.4 1-2.8 2-4 .3 1.5 1.2 2.3 2 3 .6-1 1.2-1.6 2-2 0 3.2-1 6-3 6Z"/>,
    lift: <><path d="M5 3h14v18H5zM8 6h8v5H8zM8 14h3M13 14h3M8 17h3M13 17h3"/></>,
    dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export type DashboardCategory = {
  id: string;
  label: string;
  count: string;
  note: string;
  icon: IconName;
  tone: string;
};

export type DashboardEquipment = {
  id: string;
  name: string;
  category: string;
  location: string;
  status: string;
  updated: string;
  icon: IconName;
  group: string;
};

type DashboardProps = {
  categories: DashboardCategory[];
  equipment: DashboardEquipment[];
  facilityName: string;
  userEmail: string;
};

const schedules = [
  { day: "18", month: "10월", title: "저수조 정기 청소", detail: "기계설비 · 지하 2층", color: "blue" },
  { day: "21", month: "10월", title: "소방 종합정밀점검", detail: "소방설비 · 전 구역", color: "red" },
  { day: "24", month: "10월", title: "비상발전기 부하시험", detail: "전기설비 · 발전기실", color: "amber" },
];

export default function DashboardClient({ categories, equipment, facilityName, userEmail }: DashboardProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAlerts, setShowAlerts] = useState(false);
  const filteredEquipment = useMemo(() => equipment.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.group === selectedCategory;
    const matchesSearch = `${item.name} ${item.category} ${item.location}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  }), [query, selectedCategory]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="시설ON 홈">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span className="brand-copy"><strong>시설ON</strong><small>FACILITY PORTAL</small></span>
        </a>
        <div className="site-switcher"><span className="site-avatar">{facilityName.slice(0, 1)}</span><span className="site-copy"><strong>{facilityName}</strong><small>시설관리 포털</small></span><Icon name="chevron" size={15} /></div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="주 메뉴">
          <a className="nav-item active" href="#overview"><Icon name="grid" /><span>대시보드</span></a>
          <a className="nav-item" href="#equipment"><Icon name="settings" /><span>시설물 정보</span><span className="nav-count">{equipment.length}</span></a>
          <a className="nav-item" href="#schedule"><Icon name="calendar" /><span>점검 일정</span></a>
          <a className="nav-item" href="#work-orders"><Icon name="clipboard" /><span>작업 관리</span><span className="nav-dot" /></a>
          <a className="nav-item" href="#documents"><Icon name="file" /><span>도면·문서</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="support-card"><div className="support-icon"><Icon name="settings" size={17} /></div><strong>시설 운영 지원</strong><p>관리자 설정과 사용자 권한을 확인하세요.</p><a href="#settings">관리 설정 <Icon name="arrow" size={14} /></a></div>
          <div className="profile"><div className="profile-avatar">{userEmail.slice(0, 1).toUpperCase()}</div><div className="profile-copy"><strong>{userEmail}</strong><small>시설 멤버</small></div></div>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <div className="breadcrumbs"><span>워크스페이스</span><Icon name="chevron" size={14} /><strong>대시보드</strong></div>
          <div className="top-actions">
            <label className="global-search"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="시설물, 위치 검색" aria-label="시설물 및 위치 검색" /><kbd>⌘ K</kbd></label>
            <div className="alert-wrap"><button className={`icon-button alert-button ${showAlerts ? "selected" : ""}`} onClick={() => setShowAlerts(!showAlerts)} aria-label="알림 보기" aria-expanded={showAlerts}><Icon name="bell" /><i /></button>{showAlerts && <div className="alert-popover"><strong>알림 센터</strong><p><span className="alert-dot" /> 확인이 필요한 항목이 2건 있습니다.</p><a href="#work-orders">미확인 점검 기록 보기 <Icon name="arrow" size={13} /></a></div>}</div>
            <span className="top-divider" />
            <form action={signOut}><button className="logout-button" type="submit">로그아웃</button></form>
            <div className="top-user"><span className="profile-avatar small">{userEmail.slice(0, 1).toUpperCase()}</span><span>{userEmail}</span></div>
          </div>
        </header>

        <div className="content-wrap">
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="live-dot" /> Supabase 연결 <span className="eyebrow-divider">/</span> 시설 데이터 실시간 조회</div><h1>안녕하세요 <span className="wave">👋</span></h1><p>등록된 시설과 설비 정보를 확인하세요.</p></div>
            <button className="primary-button" onClick={() => document.getElementById("equipment")?.scrollIntoView({ behavior: "smooth" })}><span>⌕</span> 시설물 조회</button>
          </section>

          <div className="dashboard-columns">
            <div className="primary-column">
              <section className="panel category-panel">
                <div className="section-heading"><div><div className="section-kicker">FACILITY CATEGORIES</div><h2>공종별 시설물</h2><p>관리 중인 설비를 공종별로 확인합니다.</p></div><a href="#equipment" className="text-link">전체 시설물 <Icon name="arrow" size={14} /></a></div>
                <div className="category-grid">{categories.map((item) => <button key={item.id} className={`category-card ${selectedCategory === item.id ? "category-selected" : ""}`} onClick={() => { setSelectedCategory(selectedCategory === item.id ? "all" : item.id); document.getElementById("equipment")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><span className={`category-icon ${item.tone}`}><Icon name={item.icon} size={21} /></span><span className="category-details"><strong>{item.label}</strong><small>{item.note}</small></span><span className="category-count">{item.count}<small>개</small></span><Icon name="chevron" size={15} /></button>)}</div>
              </section>

              <section className="panel equipment-panel" id="equipment">
                <div className="section-heading equipment-heading"><div><div className="section-kicker">RECENTLY UPDATED</div><h2>최근 업데이트 시설물</h2><p>설비 상태와 최근 변경 사항입니다.</p></div><a href="#equipment" className="text-link">전체 보기 <Icon name="arrow" size={14} /></a></div>
                <div className="table-wrap"><table><thead><tr><th>시설물</th><th>공종</th><th>위치</th><th>상태</th><th>업데이트</th><th><span className="sr-only">상세</span></th></tr></thead><tbody>{filteredEquipment.map((item) => <tr key={item.id}><td><span className={`table-equip-icon ${item.group}`}><Icon name={item.icon} size={17}/></span>{item.name === "지하 2층 저수조" ? <Link className="equipment-name-link" href="/equipment/water-tank">{item.name}</Link> : <strong>{item.name}</strong>}</td><td>{item.category}</td><td>{item.location}</td><td><span className={`table-status ${item.status === "정상" ? "ok" : item.status === "주의" ? "warn" : item.status === "알람" ? "alarm" : "planned"}`}><i />{item.status}</span></td><td className="updated-time">{item.updated}</td><td><button className="icon-button row-more" aria-label={`${item.name} 메뉴`}><Icon name="dots" size={17}/></button></td></tr>)}</tbody></table>{filteredEquipment.length === 0 && <div className="empty-state">검색 결과가 없습니다. 검색어 또는 공종을 바꿔보세요.</div>}</div>
                <div className="table-bottom"><span>최근 업데이트 기준 <b>{filteredEquipment.length}</b>개 표시</span><button className="table-filter" onClick={() => { setQuery(""); setSelectedCategory("all"); }}>필터 초기화 <span>↺</span></button></div>
              </section>
            </div>

            <aside className="secondary-column">
              <section className="panel schedule-panel" id="schedule">
                <div className="section-heading compact"><div><div className="section-kicker">SAMPLE SCHEDULE</div><h2>이달의 주요 일정 · 예시</h2></div><button className="icon-button tiny" aria-label="일정 더 보기"><Icon name="dots" /></button></div>
                <div className="month-label"><Icon name="calendar" size={15}/> 2026년 10월 <button aria-label="다음 달">‹</button><button aria-label="다음 달">›</button></div>
                <div className="schedule-list">{schedules.map((item) => <div className="schedule-item" key={item.title}><div className={`date-badge ${item.color}`}><strong>{item.day}</strong><small>{item.month}</small></div><div className="schedule-info"><strong>{item.title}</strong><small>{item.detail}</small></div><button className="icon-button tiny schedule-more" aria-label={`${item.title} 메뉴`}><Icon name="dots" size={16}/></button></div>)}</div>
                <a className="schedule-link" href="#schedule">전체 일정 보기 <Icon name="arrow" size={14}/></a>
              </section>

              <section className="panel attention-panel" id="work-orders">
                <div className="section-heading compact"><div><div className="section-kicker">SAMPLE ALERTS</div><h2>확인할 항목 · 예시</h2></div><span className="attention-count">2</span></div>
                <div className="attention-item"><span className="attention-symbol red"><Icon name="bell" size={16}/></span><div><strong>주차장 CCTV 신호 불안정</strong><small>B2 · 주차구역 C <span>· 09:32</span></small></div><Icon name="chevron" size={15}/></div>
                <div className="attention-item"><span className="attention-symbol amber"><Icon name="clipboard" size={16}/></span><div><strong>수배전반 정기 점검 예정</strong><small>B1 · 전기실 <span>· 오늘 14:00</span></small></div><Icon name="chevron" size={15}/></div>
                <a className="attention-link" href="#work-orders">점검 및 조치 확인 <Icon name="arrow" size={14}/></a>
              </section>
              <div className="data-note"><span className="data-note-icon"><Icon name="clock" size={16}/></span><span><strong>데이터 연결 상태</strong><small>설비 조회 연결 · 일정/알림은 예시</small></span><span className="sync-indicator" title="Supabase 연결"/></div>
            </aside>
          </div>
          <footer className="page-footer"><span>시설ON <i>·</i> {facilityName} 시설관리 포털</span><span>설비 목록과 제원은 Supabase에서 조회합니다. 일정과 알림은 예시입니다.</span></footer>
        </div>
      </main>
    </div>
  );
}
