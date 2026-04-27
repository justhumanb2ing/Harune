"use client";

import { env } from "@/env";
import { type Variants, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";

const signInEnabled = env.NEXT_PUBLIC_SIGNIN_ENABLED === "true";

const linkInBioVariants: Variants = {
  hidden: {
    opacity: 0,
    rotate: -8,
    scale: 0.68,
    y: 36,
  },
  visible: {
    opacity: 1,
    rotate: -6,
    scale: 1,
    transition: {
      bounce: 0.42,
      damping: 11,
      mass: 0.75,
      stiffness: 420,
      type: "spring",
    },
    y: 0,
  },
};

export default function MainHeroSection() {
  return (
    <section className="min-h-dvh flex flex-col items-center justify-center gap-40">
      <header className="flex flex-col gap-4 items-center">
        <motion.div className="mb-20 flex flex-col gap-2 items-center">
          <div className="size-20 aspect-square rounded-xl">
            <Image
              src={"/assets/logo.jpeg"}
              alt="Harune Logo"
              width={64}
              height={64}
              className="mb-4 rounded-lg object-cover size-full"
            />
          </div>
          <h1 className="text-xl sm:text-xl font-bold">Harune</h1>
        </motion.div>
        <motion.div
          animate="visible"
          className="origin-left self-center rounded-2xl bg-background p-2 shadow-lg cursor-default"
          initial="hidden"
          variants={linkInBioVariants}
          whileHover={{
            rotate: -8,
            scale: 1.06,
            transition: {
              bounce: 0.35,
              damping: 10,
              stiffness: 360,
              type: "spring",
            },
            y: -5,
          }}
        >
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-5xl text-primary-foreground bg-indigo-400 rounded-xl p-3 px-6 py-3">
            A Link in Bio
          </h2>
        </motion.div>
        <h3 className="flex flex-col items-center gap-6 text-3xl font-bold sm:text-5xl">
          <p>One page, all of you.</p>
          <p className="flex flex-col items-center font-normal text-base text-muted-foreground sm:text-xl">
            <span>Share everything you do, all in one place</span>
            <span>— create a page that shows who you are.</span>
          </p>
        </h3>
      </header>

      <div className="flex flex-col items-center gap-1">
        <Button
          nativeButton={false}
          size="lg"
          className={"h-12 min-w-48 font-bold! brand-button text-base px-24 py-8 rounded-xl"}
          render={
            <Link href="/join" className="inline-block uppercase">
              <span className="uppercase sm:hidden">Sign up</span>
              <span className="hidden uppercase sm:inline">Sign Up For Free</span>
            </Link>
          }
        />
        {signInEnabled && (
          <Button
            nativeButton={false}
            size="lg"
            variant="link"
            render={
              <Link href="/login" className="text-xs font-medium">
                Log In
              </Link>
            }
          />
        )}
      </div>
    </section>
  );
}
