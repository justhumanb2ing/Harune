"use client";

import { AnimatePresence, MotionConfig, type Transition, motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const sectionLinkClassName =
  "group/item flex w-full flex-wrap gap-2.5 rounded-2xl bg-background px-4 py-3 text-sm transition-colors outline-none hover:bg-background! focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 hover:bg-secondary/30!";

const COLLAPSED_HEIGHT = 128;
const EXPANDED_HEIGHT = 248;
const BOX_RADIUS = 16;

const EMPHASIZED_EASE = [0.22, 1, 0.36, 1] as const;
const EXIT_EASE = [0.4, 0, 1, 1] as const;

const shellExpandTransition: Transition = {
  height: {
    type: "spring",
    stiffness: 420,
    damping: 22,
    mass: 0.78,
  },
  borderRadius: {
    type: "spring",
    stiffness: 420,
    damping: 22,
    mass: 0.78,
  },
  scale: {
    duration: 0.34,
    ease: EMPHASIZED_EASE,
    times: [0, 0.55, 1],
  },
  y: {
    duration: 0.34,
    ease: EMPHASIZED_EASE,
    times: [0, 0.55, 1],
  },
};

const shellCollapseTransition: Transition = {
  height: {
    type: "spring",
    stiffness: 500,
    damping: 34,
    mass: 0.85,
  },
  borderRadius: {
    type: "spring",
    stiffness: 500,
    damping: 34,
    mass: 0.85,
  },
  scale: {
    duration: 0.18,
    ease: EXIT_EASE,
  },
  y: {
    duration: 0.18,
    ease: EXIT_EASE,
  },
};

const panelTransition: Transition = {
  delay: 0.06,
  duration: 0.28,
  ease: EMPHASIZED_EASE,
};

const panelExitTransition: Transition = {
  duration: 0.16,
  ease: EXIT_EASE,
};

type TextBlockSectionLinkItemProps = {
  onAdd: (textBox: { description: string; title: string }) => void;
};

export function TextBlockSectionLinkItem({ onAdd }: TextBlockSectionLinkItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const canAdd = title.trim().length > 0;

  const reset = () => {
    setTitle("");
    setDescription("");
    setIsExpanded(false);
  };

  const handleAdd = () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    onAdd({
      title: trimmedTitle,
      description,
    });
    reset();
  };

  return (
    <MotionConfig transition={shellExpandTransition}>
      <motion.div
        animate={{
          height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
          borderRadius: BOX_RADIUS,
          scale: isExpanded ? [1, 1.018, 1] : 1,
          y: isExpanded ? [0, -3, 0] : 0,
        }}
        transition={isExpanded ? shellExpandTransition : shellCollapseTransition}
        className="w-full overflow-hidden bg-background shadow-float"
      >
        <AnimatePresence initial={false} mode="sync">
          {isExpanded ? (
            <motion.div
              key="text-block-expanded"
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                y: 16,
                filter: "blur(8px)",
                transition: panelExitTransition,
              }}
              transition={panelTransition}
              className="flex h-full min-h-0 flex-col overflow-hidden bg-background p-2"
            >
              <div className="grid grid-cols-3 items-center px-1 py-1">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={reset}
                  className="h-10 justify-self-start rounded-md border-border/60 px-4 text-base font-semibold shadow-sm"
                >
                  Cancel
                </Button>
                <p className="justify-self-center text-xl font-medium">Add Text</p>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  disabled={!canAdd}
                  onClick={handleAdd}
                  className="brand-success-button h-10 justify-self-end rounded-md border px-6 text-base font-semibold text-primary-foreground shadow-sm hover:text-primary-foreground"
                >
                  Add
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  y: 8,
                  filter: "blur(6px)",
                  transition: panelExitTransition,
                }}
                transition={panelTransition}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <div className="space-y-0 p-1">
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="What do you want to write?"
                    className="h-11 w-full min-w-0 max-w-full border-0 text-lg! font-medium focus-visible:ring-0"
                  />
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Add description for detail"
                    className="max-h-64 min-h-32 w-full min-w-0 max-w-full resize-none overflow-x-hidden overflow-y-auto break-all border-0 text-base! [field-sizing:fixed] [overflow-wrap:anywhere] focus-visible:ring-0"
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.button
              key="text-block-collapsed"
              type="button"
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                y: 16,
                filter: "blur(8px)",
                transition: panelExitTransition,
              }}
              transition={panelTransition}
              onClick={() => setIsExpanded(true)}
              className={cn(sectionLinkClassName, "h-full text-left")}
            >
              <div className="flex w-full flex-col justify-between">
                <p className="flex flex-1 flex-col gap-1">
                  <span className="flex w-fit items-center gap-2 text-2xl leading-snug font-medium">
                    Text
                  </span>
                  {/*<span className="text-sm text-muted-foreground">
                    Use for notes, context, and non-link content.
                  </span>*/}
                </p>
                <p className="text-right font-medium text-muted-foreground p-1">click to add</p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}
