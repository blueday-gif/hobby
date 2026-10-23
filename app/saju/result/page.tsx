import type { Metadata } from "next";
import GuestResult from "../_components/guest-result";

export const metadata: Metadata = { title: "내 사주 취미 결과" };

export default function SajuGuestResultPage() {
  return <GuestResult />;
}
