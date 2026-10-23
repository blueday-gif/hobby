import { redirect } from "next/navigation";
import DashboardClient, { type DashboardCategory, type DashboardEquipment } from "./dashboard-client";
import { createClient } from "@/lib/supabase/server";

const categoryPresentation: Record<string, { note: string; icon: DashboardCategory["icon"]; tone: string }> = {
  mechanical: { note: "저수조 · 펌프 · 환기", icon: "water", tone: "blue" },
  electrical: { note: "수배전반 · 발전기 · 조명", icon: "bolt", tone: "amber" },
  communications: { note: "CCTV · 네트워크 · 방송", icon: "camera", tone: "violet" },
  fire: { note: "수신기 · 펌프 · 감지기", icon: "fire", tone: "red" },
  building: { note: "승강기 · 출입문 · 마감", icon: "lift", tone: "green" },
  ventilation: { note: "유인휀 · 급배기 · 댐퍼", icon: "fan", tone: "cyan" },
};

const statusLabel: Record<string, string> = {
  normal: "정상",
  caution: "주의",
  alarm: "알람",
  offline: "오프라인",
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("facility_members")
    .select("facility_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/login?error=membership");

  const [facilityResult, categoryResult, equipmentResult] = await Promise.all([
    supabase.from("facilities").select("name").eq("id", membership.facility_id).maybeSingle(),
    supabase.from("equipment_categories").select("id,name,slug,sort_order").order("sort_order"),
    supabase
      .from("equipment")
      .select("id,name,location,status,updated_at,category_id,equipment_categories(name,slug)")
      .eq("facility_id", membership.facility_id)
      .order("updated_at", { ascending: false }),
  ]);

  const equipmentRows = equipmentResult.data ?? [];
  const counts = new Map<string, number>();
  const equipment: DashboardEquipment[] = equipmentRows.map((row) => {
    const relation = row.equipment_categories;
    const category = Array.isArray(relation) ? relation[0] : relation;
    const group = category?.slug ?? "mechanical";
    counts.set(group, (counts.get(group) ?? 0) + 1);
    const presentation = categoryPresentation[group] ?? { note: "시설 설비", icon: "settings" as const, tone: "blue" };

    return {
      id: row.id,
      name: row.name,
      category: category?.name ?? "미분류",
      location: row.location,
      status: statusLabel[row.status] ?? row.status,
      updated: new Intl.DateTimeFormat("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Seoul",
      }).format(new Date(row.updated_at)),
      icon: presentation.icon,
      group,
    };
  });

  const categories: DashboardCategory[] = (categoryResult.data ?? []).map((category) => {
    const presentation = categoryPresentation[category.slug] ?? { note: "시설 설비", icon: "settings" as const, tone: "blue" };
    return {
      id: category.slug,
      label: category.name,
      count: String(counts.get(category.slug) ?? 0),
      ...presentation,
    };
  });

  return (
    <DashboardClient
      categories={categories}
      equipment={equipment}
      facilityName={facilityResult.data?.name ?? "시설관리"}
      userEmail={user.email ?? "사용자"}
    />
  );
}
