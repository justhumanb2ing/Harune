"use client";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { ArrowUpIcon, EyeIcon, MousePointerClickIcon, PercentIcon, TrophyIcon } from "lucide-react";
import { type Variants, motion } from "motion/react";
import { useState } from "react";

const numberFormatter = new Intl.NumberFormat("en-US");

const analyticsMetrics = [
  {
    change: "+18%",
    icon: EyeIcon,
    label: "Views",
    value: "12,482",
  },
  {
    change: "+24%",
    icon: MousePointerClickIcon,
    label: "Clicks",
    value: "3,186",
  },
  {
    change: "+4pp",
    icon: PercentIcon,
    label: "CTR",
    value: "25%",
  },
  {
    detail: "1,124 clicks / 35% share",
    icon: TrophyIcon,
    label: "Top Item",
    value: "Spring drop",
  },
];

const topClickedItems = [
  {
    change: "+31%",
    clicks: 1124,
    kind: "link",
    label: "Spring drop",
  },
  {
    change: "+18%",
    clicks: 842,
    kind: "social",
    label: "Instagram",
  },
  {
    change: "+12%",
    clicks: 526,
    kind: "link",
    label: "Portfolio",
  },
  {
    change: "New",
    clicks: 394,
    kind: "link",
    label: "Newsletter",
  },
  {
    change: "+7%",
    clicks: 300,
    kind: "social",
    label: "Threads",
  },
];

const headerVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 42,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.72,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.11,
    },
    y: 0,
  },
};

const headerTextVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 22,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.58,
      ease: [0.16, 1, 0.3, 1],
    },
    y: 0,
  },
};

const analyticsPreviewVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 36,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delayChildren: 0.08,
      duration: 0.46,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
    },
    y: 0,
  },
};

const analyticsCardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 26,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
    y: 0,
  },
};

const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10,
    y: 10,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.36,
      ease: [0.16, 1, 0.3, 1],
    },
    x: 0,
    y: 0,
  },
};

type AnalyticsPreviewProps = {
  isVisible: boolean;
};

function AnalyticsPreview({ isVisible }: AnalyticsPreviewProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      aria-label="Analytics preview"
      animate="visible"
      className="relative w-full max-w-4xl overflow-hidden px-4 pt-4 sm:px-6"
      initial="hidden"
      variants={analyticsPreviewVariants}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {analyticsMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <motion.div
              className="grid min-h-32 grid-rows-[1rem_1fr] gap-5 rounded-xl bg-background p-4 shadow-float lg:aspect-square lg:min-h-0"
              key={metric.label}
              variants={analyticsCardVariants}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium uppercase">{metric.label}</div>
                <Icon className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col justify-end gap-1">
                <div className="truncate text-3xl font-bold tracking-tight md:text-4xl">
                  {metric.value}
                </div>
                <div className="inline-flex w-fit items-center gap-1 text-xs font-medium text-green-500">
                  {metric.detail ?? metric.change}
                  {!metric.detail && <ArrowUpIcon className="size-3" />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className="mt-3 rounded-xl bg-background p-4 shadow-float"
        variants={analyticsCardVariants}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Top clicked items</h2>
          <span className="text-xs text-muted-foreground">{topClickedItems.length} items</span>
        </div>
        <motion.div className="divide-y divide-border" variants={analyticsPreviewVariants}>
          {topClickedItems.map((item) => (
            <motion.div
              className="flex items-center gap-3 py-3"
              key={`${item.kind}:${item.label}`}
              variants={listItemVariants}
            >
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-sm font-medium">{item.label}</div>
                <div className="text-xs capitalize text-muted-foreground">{item.kind}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{numberFormatter.format(item.clicks)}</div>
                <div className="text-xs text-muted-foreground">{item.change}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <ProgressiveBlur
        blurIntensity={0.9}
        blurLayers={10}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44"
        direction="bottom"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-background/0 via-background/70 to-background" />
    </motion.div>
  );
}

export default function AnalyticsCardSection() {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  return (
    <section className="flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden py-16">
      <motion.header
        className="flex flex-col items-center gap-4"
        initial="hidden"
        onAnimationComplete={() => setIsPreviewVisible(true)}
        variants={headerVariants}
        viewport={{ once: true, margin: "-80px" }}
        whileInView="visible"
      >
        <motion.p
          className="pointer-events-none text-center text-3xl font-semibold tracking-normal text-foreground md:text-5xl"
          variants={headerTextVariants}
        >
          Simple insights
          <span className="text-indigo-400">.</span>
          {/*Simple insights — who visited, what they clicked.*/}
        </motion.p>
        <motion.p
          className="pointer-events-none text-center text-2xl font-normal md:text-3xl"
          variants={headerTextVariants}
        >
          who visited, what they clicked.
        </motion.p>
      </motion.header>
      <AnalyticsPreview isVisible={isPreviewVisible} />
    </section>
  );
}
