import type {
  BundleFilters,
  ConsoleApiClient,
  ConsoleBundle,
} from "@hot-updater/console";
import type {
  createHotUpdaterConsoleApi,
} from "@hot-updater/console/hosted";
import { createServerFn } from "@tanstack/react-start";

import { requireConsoleSession } from "./auth.server";

type ConsoleServerApi = ReturnType<typeof createHotUpdaterConsoleApi>;
type JsonValue =
  | boolean
  | null
  | number
  | string
  | JsonObject
  | JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type SerializableBundle = JsonObject & { id: string };
type SerializableBundleList = {
  data: SerializableBundle[];
  pagination?: {
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    total: number;
    totalPages: number;
  };
};

let apiPromise: Promise<ConsoleServerApi> | null = null;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toJsonValue = (value: unknown): JsonValue | undefined => {
  if (value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item) ?? null);
  }

  if (isRecord(value)) {
    return toJsonObject(value);
  }

  return undefined;
};

const toJsonObject = (value: Record<string, unknown>): JsonObject => {
  const output: JsonObject = {};

  for (const [key, item] of Object.entries(value)) {
    const jsonValue = toJsonValue(item);
    if (jsonValue !== undefined) {
      output[key] = jsonValue;
    }
  }

  return output;
};

const toSerializableBundle = (bundle: ConsoleBundle): SerializableBundle => {
  const output: SerializableBundle = { id: bundle.id };

  for (const [key, item] of Object.entries(bundle)) {
    if (key === "id") {
      continue;
    }

    const jsonValue = toJsonValue(item);
    if (jsonValue !== undefined) {
      output[key] = jsonValue;
    }
  }

  return output;
};

const getConsoleApi = async () => {
  if (!apiPromise) {
    apiPromise = Promise.all([
      import("../../hot-updater.config"),
      import("@hot-updater/console/hosted"),
    ])
      .then(async ([{ default: config }, { createHotUpdaterConsoleApi }]) => {
        return createHotUpdaterConsoleApi(config);
      })
      .catch((error) => {
        apiPromise = null;
        throw error;
      });
  }

  return apiPromise;
};

const getGuardedConsoleApi = async () => {
  await requireConsoleSession();
  return getConsoleApi();
};

const getConfig = createServerFn().handler(async () => {
  const config = await (await getGuardedConsoleApi()).getConfig();
  return config.console ? { console: toJsonObject(config.console) } : {};
});

const getConfigLoaded = createServerFn().handler(async () => {
  return (await getGuardedConsoleApi()).getConfigLoaded();
});

const getChannels = createServerFn().handler(async () => {
  return (await getGuardedConsoleApi()).getChannels();
});

const getBundles = createServerFn({ method: "GET" })
  .validator((input: BundleFilters | undefined) => input)
  .handler(async ({ data }): Promise<SerializableBundleList> => {
    const bundles = await (await getGuardedConsoleApi()).getBundles(data);
    return {
      data: bundles.data.map(toSerializableBundle),
      pagination: bundles.pagination,
    };
  });

const getBundle = createServerFn({ method: "GET" })
  .validator((input: { bundleId: string }) => input)
  .handler(async ({ data }) => {
    const bundle = await (await getGuardedConsoleApi()).getBundle(data);
    return bundle ? toSerializableBundle(bundle) : null;
  });

const getBundleChildren = createServerFn({ method: "GET" })
  .validator((input: { baseBundleId: string }) => input)
  .handler(async ({ data }) => {
    const bundles = await (await getGuardedConsoleApi()).getBundleChildren(data);
    return bundles.map(toSerializableBundle);
  });

const getBundleChildCounts = createServerFn({ method: "GET" })
  .validator((input: { bundleIds: string[] }) => input)
  .handler(async ({ data }) => {
    return (await getGuardedConsoleApi()).getBundleChildCounts(data);
  });

const getBundleDownloadUrl = createServerFn({ method: "GET" })
  .validator((input: { bundleId: string }) => input)
  .handler(async ({ data }) => {
    return (await getGuardedConsoleApi()).getBundleDownloadUrl(data);
  });

const updateBundle = createServerFn({ method: "POST" })
  .validator((input: { bundle: JsonObject; bundleId: string }) => input)
  .handler(async ({ data }) => {
    const result = await (await getGuardedConsoleApi()).updateBundle(data);
    return {
      ...result,
      bundle: toSerializableBundle(result.bundle),
    };
  });

const promoteBundle = createServerFn({ method: "POST" })
  .validator(
    (input: {
      action: "copy" | "move";
      bundleId: string;
      nextBundleId?: string;
      targetChannel: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const result = await (await getGuardedConsoleApi()).promoteBundle(data);
    return {
      ...result,
      bundle: toSerializableBundle(result.bundle),
    };
  });

const createBundle = createServerFn({ method: "POST" })
  .validator((input: SerializableBundle) => input)
  .handler(async ({ data }) => {
    return (await getGuardedConsoleApi()).createBundle(data);
  });

const deleteBundle = createServerFn({ method: "POST" })
  .validator((input: { bundleId: string }) => input)
  .handler(async ({ data }) => {
    return (await getGuardedConsoleApi()).deleteBundle(data);
  });

export const consoleApiClient = {
  createBundle: (bundle) => createBundle({ data: toSerializableBundle(bundle) }),
  deleteBundle: (params) => deleteBundle({ data: params }),
  getBundle: (params) => getBundle({ data: params }),
  getBundleChildCounts: (params) => getBundleChildCounts({ data: params }),
  getBundleChildren: (params) => getBundleChildren({ data: params }),
  getBundleDownloadUrl: (params) => getBundleDownloadUrl({ data: params }),
  getBundles: (filters) => getBundles({ data: filters }),
  getChannels: () => getChannels(),
  getConfig: () => getConfig(),
  getConfigLoaded: () => getConfigLoaded(),
  promoteBundle: (params) => promoteBundle({ data: params }),
  updateBundle: (params) =>
    updateBundle({
      data: {
        bundle: toJsonObject(params.bundle),
        bundleId: params.bundleId,
      },
    }),
} satisfies ConsoleApiClient;
