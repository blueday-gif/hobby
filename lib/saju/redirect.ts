/** 로그인 후 기본 이동 경로: 비회원 임시 결과를 DB로 옮기는 페이지 */
export const DEFAULT_NEXT = "/saju/result/migrate";

/**
 * 로그인 후 이동할 경로(`next`)를 검증한다.
 * 외부 주소나 `//evil.com` 같은 값으로 리다이렉트되지 않도록 `/saju` 아래 내부 경로만 허용한다.
 */
export function safeNext(value: string | null | undefined): string {
  if (!value) return DEFAULT_NEXT;
  if (value.includes("\\") || value.startsWith("//")) return DEFAULT_NEXT;
  if (value !== "/saju" && !/^\/saju[/?#]/.test(value)) return DEFAULT_NEXT;
  return value;
}
