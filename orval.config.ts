import { defineConfig } from "orval";

const openApiSpecUrl = "https://api.harune.me/docs/openapi";

const sharedInput = {
  target: openApiSpecUrl,
  unsafeDisableValidation: true,
};

const sharedOutput = {
  clean: true,
  indexFiles: false,
  mode: "tags-split" as const,
  namingConvention: "kebab-case" as const,
  formatter: "biome" as const,
};

export default defineConfig({
  haruneHttp: {
    input: sharedInput,
    output: {
      ...sharedOutput,
      baseUrl: {
        runtime: "process.env.NEXT_PUBLIC_API_BASE_URL",
      },
      client: "react-query",
      httpClient: "fetch",
      schemas: "src/lib/api/generated/http/schemas",
      target: "src/lib/api/generated/http",
      override: {
        mutator: {
          name: "orvalMutator",
          path: "./src/lib/api/orval-mutator.ts",
        },
      },
    },
  },
  haruneZod: {
    input: sharedInput,
    output: {
      ...sharedOutput,
      client: "zod",
      fileExtension: ".zod.ts",
      target: "src/lib/api/generated/zod",
    },
  },
});
