import { useEffect, useState } from "react";
import { normalizeHexColorInput } from "@/components/grid/grid-text-surface";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GridBackgroundColorInputProps = {
  ariaLabel: string;
  className?: string;
  inputId: string;
  onColorChange: (nextColor: string) => void;
  value: string;
};

export function GridBackgroundColorInput({
  ariaLabel,
  className,
  inputId,
  onColorChange,
  value,
}: GridBackgroundColorInputProps) {
  const [draftColor, setDraftColor] = useState(value);
  const normalizedDraftColor = normalizeHexColorInput(draftColor);
  const isInvalid = draftColor.trim().length > 0 && !normalizedDraftColor;

  useEffect(() => {
    setDraftColor(value);
  }, [value]);

  const commitDraftColor = () => {
    if (!normalizedDraftColor || normalizedDraftColor === value) {
      return;
    }

    onColorChange(normalizedDraftColor);
  };

  return (
    <div className={cn("flex w-full items-center gap-1.5 px-1 pb-1", className)}>
      <span
        aria-hidden
        className="size-6 shrink-0 rounded-full border border-white/20"
        style={{ backgroundColor: normalizedDraftColor ?? value }}
      />
      <Input
        aria-invalid={isInvalid}
        aria-label={ariaLabel}
        className="h-8 flex-1 border-white/10 bg-background/10 px-2 font-mono text-primary-foreground text-xs shadow-none placeholder:text-primary-foreground/45 focus-visible:border-white/40 focus-visible:ring-white/20"
        id={inputId}
        inputMode="text"
        onBlur={commitDraftColor}
        onChange={(event) => {
          setDraftColor(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitDraftColor();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setDraftColor(value);
          }
        }}
        placeholder="#ffffff"
        spellCheck={false}
        value={draftColor}
      />
    </div>
  );
}
