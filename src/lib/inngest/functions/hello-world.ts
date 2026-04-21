import { inngest } from "../client";

export const helloWorld = inngest.createFunction(
  // TODO: This is a sample function. You can delete it.
  // TIP: https://docs.indiekit.pro/setup/background-jobs provides more information on how to create background jobs with Inngest.
  // Sample Email Sequence: https://docs.indiekit.pro/setup/background-jobs#example-email-sequence-

  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);
