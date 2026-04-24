"use client";

import { type FocusEvent, useRef } from "react";

import { ProfilePageSectionLayout } from "@/components/section/profile-page/section-layout";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput, InputGroupTextarea } from "@/components/ui/input-group";

export function TextBoxesSectionEditor() {
  const editor = useProfilePageEditor();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const handleComposerBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocusedNode = event.relatedTarget;

    if (nextFocusedNode instanceof Node && composerRef.current?.contains(nextFocusedNode)) {
      return;
    }

    editor.handleNewTextBoxComposerBlur();
  };

  return (
    <ProfilePageSectionLayout
      title="Text"
      description="Use text boxes for notes, context, and non-link content."
      isLoading={editor.isBooting || editor.isUserLoading}
      hasData={Boolean(editor.data)}
    >
      {editor.data ? (
        <div ref={composerRef} className="space-y-3" onBlur={handleComposerBlur}>
          <FieldGroup className="gap-3">
            <Field className="relative rounded-lg bg-background py-4 shadow-brand outline-none">
              <FieldLabel
                htmlFor="new-text-box-title"
                className="block px-4 font-medium text-xs text-foreground uppercase"
              >
                Title <span className="text-destructive">*</span>
              </FieldLabel>
              <InputGroup className="border-0 bg-background px-1.5 ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                <InputGroupInput
                  id="new-text-box-title"
                  value={editor.newTextBox.title}
                  onChange={(event) =>
                    editor.setNewTextBox((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="What do you want to write?"
                  className="text-sm"
                />
              </InputGroup>
            </Field>
            <Field className="relative rounded-lg bg-background py-4 shadow-brand outline-none">
              <FieldLabel
                htmlFor="new-text-box-description"
                className="block px-4 font-medium text-xs text-foreground uppercase"
              >
                Description
              </FieldLabel>
              <InputGroup className="border-0 bg-background px-1.5 ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                <InputGroupTextarea
                  id="new-text-box-description"
                  value={editor.newTextBox.description}
                  onChange={(event) =>
                    editor.setNewTextBox((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Add description for detail"
                  className="min-h-12 text-sm"
                />
              </InputGroup>
            </Field>
          </FieldGroup>
        </div>
      ) : null}
    </ProfilePageSectionLayout>
  );
}
