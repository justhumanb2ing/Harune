"use client";

import { DotIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";

type OnboardingFormProps = {
  handle?: string;
};

export function OnboardingForm({ handle }: OnboardingFormProps) {
  return (
    <div className="flex h-full flex-col gap-8 bg-background py-6">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-4xl space-y-8">
          <header className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Onboarding
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">Claim your page shell</h1>
            <p className="text-muted-foreground">
              Backend behavior is disconnected, but the onboarding layout is kept intact.
            </p>
          </header>

          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Step 1</span>
                <DotIcon className="size-4" />
                <span>Step 2</span>
              </div>

              <div className="space-y-4">
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <InputGroupText>harune.me/</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput value={handle || ""} disabled placeholder="handle" />
                </InputGroup>

                <Input placeholder="Name" disabled />
                <Input placeholder="Role" disabled />
                <Input placeholder="Location" disabled />
                <Textarea placeholder="Bio" disabled className="min-h-28" />

                <Button type="button" disabled className="w-full">
                  Continue
                </Button>
              </div>
            </div>

            <aside className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="flex h-full min-h-[22rem] flex-col justify-between gap-6">
                <div className="flex items-center justify-center rounded-2xl border border-dashed p-10">
                  <span className="text-center text-sm text-muted-foreground">
                    Preview area stays visible for layout parity.
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3">
                  <span className="text-sm font-medium">Upload zone</span>
                  <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}
