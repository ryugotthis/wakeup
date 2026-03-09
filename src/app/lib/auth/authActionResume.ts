// src/lib/auth/authActionResume.ts

/**
 * 역할:
 * 로그인(OAuth) 이후 **사용자가 원래 시도했던 행동(action)을 이어서 실행할 수 있도록 돕는 인증 복귀 유틸 모음**.
 *
 * 이 파일은 다음과 같은 흐름을 지원한다.
 *
 * 1. 사용자가 어떤 액션을 시도함 (예: 결과 저장, 북마크)
 * 2. 로그인 상태가 아니면 Google OAuth 로그인 진행
 * 3. 로그인 후 **원래 페이지로 돌아오면서 action query를 추가**
 *    예: ?save=1 또는 ?bookmark=1
 * 4. 페이지 로드 후 query 또는 localStorage를 확인해
 *    **로그인 이전에 시도했던 행동을 자동으로 재실행**
 * 5. 실행 완료 후 query / localStorage 정리
 *
 * 제공 기능:
 * - OAuth 로그인 후 돌아올 URL 생성
 * - 로그인 후 action 재개 여부 판단
 * - action 실행 후 query 및 localStorage 정리
 */

type BuildAuthReturnUrlParams = {
  origin: string;
  pathname: string;
  search: string;
  actionParamKey: string;
  actionParamValue: string;
};

type ShouldResumeAfterLoginParams = {
  search: string;
  actionParamKey: string;
  actionParamValue: string;
  storageKey?: string;
  storageValue?: string;
};

type ClearAuthResumeStateParams = {
  pathname: string;
  search: string;
  queryKeysToRemove: string[];
  storageKeysToRemove?: string[];
};

/**
 * 역할:
 * OAuth 로그인 이후 **사용자가 다시 돌아올 URL을 생성**한다.
 *
 * 동작:
 * - 현재 URL의 query를 유지
 * - 특정 action query를 추가 (예: save=1, bookmark=1)
 * - 완성된 redirect URL을 반환
 *
 * 사용 예:
 * 로그인 후 결과 저장을 이어서 실행하기 위해
 * /quiz/result/123?save=1 같은 URL 생성
 */
export function buildAuthReturnUrl({
  origin,
  pathname,
  search,
  actionParamKey,
  actionParamValue,
}: BuildAuthReturnUrlParams) {
  const params = new URLSearchParams(search);
  params.set(actionParamKey, actionParamValue);

  const query = params.toString();
  return `${origin}${pathname}${query ? `?${query}` : ""}`;
}

/**
 * 역할:
 * OAuth 로그인 후 페이지가 다시 로드되었을 때
 * **이전에 시도했던 action을 다시 실행해야 하는지 판단**한다.
 *
 * 판단 기준:
 * 1. URL query에 action param이 존재하는지
 *    예: ?save=1 또는 ?bookmark=1
 *
 * 2. localStorage에 pending action이 저장되어 있는지
 *    예: pendingSaveResultId, pendingBookmarkProductId
 *
 * 둘 중 하나라도 만족하면 true 반환
 */
export function shouldResumeAfterLogin({
  search,
  actionParamKey,
  actionParamValue,
  storageKey,
  storageValue,
}: ShouldResumeAfterLoginParams) {
  const params = new URLSearchParams(search);
  const queryMatched = params.get(actionParamKey) === actionParamValue;

  if (!storageKey || !storageValue) {
    return queryMatched;
  }

  let storedValue: string | null = null;

  try {
    storedValue = localStorage.getItem(storageKey);
  } catch {
    storedValue = null;
  }

  return queryMatched || storedValue === storageValue;
}

/**
 * 역할:
 * 로그인 후 자동 action 실행이 끝난 뒤
 * **URL query와 localStorage에 남아있는 임시 상태를 정리**한다.
 *
 * 정리 대상:
 * - action query
 *   예: save, bookmark
 *
 * - localStorage pending 값
 *   예: pendingSaveResultId, pendingBookmarkProductId
 *
 * 반환값:
 * 정리된 최종 URL 문자열
 *
 * 사용 예:
 * router.replace(cleanUrl)
 */
export function clearAuthResumeState({
  pathname,
  search,
  queryKeysToRemove,
  storageKeysToRemove = [],
}: ClearAuthResumeStateParams) {
  const params = new URLSearchParams(search);

  queryKeysToRemove.forEach((key) => {
    params.delete(key);
  });

  storageKeysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });

  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
