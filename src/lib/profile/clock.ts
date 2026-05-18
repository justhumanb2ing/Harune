export type ClockWidgetStyle = {
  backgroundColor: string;
};

export type ClockWidgetConfig = {
  style: ClockWidgetStyle;
  format?: "12h" | "24h";
  showDate: boolean;
  showSeconds: boolean;
  timezone?: string;
  timeZone?: string;
};

export const DEFAULT_CLOCK_BACKGROUND_COLOR = "#ffffff";

export function getDefaultClockWidgetConfig(): ClockWidgetConfig {
  return {
    format: "24h",
    showDate: true,
    showSeconds: true,
    style: {
      backgroundColor: DEFAULT_CLOCK_BACKGROUND_COLOR,
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
  };
}

export function normalizeClockWidgetConfig(
  config?: (Partial<ClockWidgetConfig> & { backgroundColor?: string | null }) | null
): ClockWidgetConfig {
  const defaultConfig = getDefaultClockWidgetConfig();
  const timezone = config?.timezone?.trim() || config?.timeZone?.trim() || defaultConfig.timezone;
  const backgroundColor =
    config?.style?.backgroundColor?.trim() ||
    config?.backgroundColor?.trim() ||
    defaultConfig.style.backgroundColor;

  return {
    format: config?.format === "12h" ? "12h" : "24h",
    showDate: config?.showDate ?? defaultConfig.showDate,
    showSeconds: config?.showSeconds ?? defaultConfig.showSeconds,
    style: {
      backgroundColor,
    },
    timezone,
  };
}

export function formatClock(date: Date, config: ClockWidgetConfig): string {
  return [formatClockDate(date, config), formatClockTime(date, config)].filter(Boolean).join(" ");
}

export function formatClockTime(date: Date, config: ClockWidgetConfig): string {
  const hour12 = config.format === "12h";
  const timezone = config.timezone ?? config.timeZone;

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: config.showSeconds !== false ? "2-digit" : undefined,
    hour12,
  });

  return formatter.format(date);
}

export function formatClockDate(date: Date, config: ClockWidgetConfig): string {
  if (!config.showDate) {
    return "";
  }

  const timezone = config.timezone ?? config.timeZone;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: config.showDate ? "numeric" : undefined,
    month: config.showDate ? "long" : undefined,
    day: config.showDate ? "numeric" : undefined,
  });

  return formatter.format(date);
}
