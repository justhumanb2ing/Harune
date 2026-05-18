export function getProfileBentoProfileShellClassName(isCompactMode = false) {
  return isCompactMode
    ? "flex w-[380px] max-w-full shrink-0 flex-col sm:w-[425px]"
    : "flex w-[380px] max-w-full shrink-0 flex-col sm:w-[425px] xl:sticky xl:top-[var(--v2-page-top-offset)] xl:self-start xl:min-w-[20rem] xl:w-[500px] xl:shrink";
}

export const PROFILE_BENTO_PROFILE_SHELL_CLASS = getProfileBentoProfileShellClassName();
