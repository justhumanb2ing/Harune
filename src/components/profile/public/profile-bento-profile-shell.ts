export function getProfileBentoProfileShellClassName(isCompactMode = false) {
  const baseClassName = "flex w-sm max-w-full shrink-0 flex-col px-4 mb-4 sm:w-[400px]";

  return isCompactMode
    ? baseClassName
    : `${baseClassName} 2xl:sticky 2xl:top-[var(--v2-page-top-offset)] 2xl:self-start 2xl:min-w-[20rem] 2xl:w-[500px] 2xl:shrink-0`;
}

export const PROFILE_BENTO_PROFILE_SHELL_CLASS = getProfileBentoProfileShellClassName();
