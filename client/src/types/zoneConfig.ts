export type SportType = "run" | "bike" | "swim";

export type MethodType = "threshold" | "max" | "race" | "custom";

type ZoneConfig = {
  pace?: number[];
  hr?: number[];
  power?: number[];
};

type TestConfig = {
  label: string;
  zones: ZoneConfig;
};

type MethodConfig = {
  tests: Record<string, TestConfig>;
};

/* 🔥 חשוב: Partial כדי שלא כל ענף חייב את כל השיטות */
export const ZONES_CONFIG: Record<
  SportType,
  Partial<Record<MethodType, MethodConfig>>
> = {
  /* ================= RUN ================= */

  run: {
    threshold: {
      tests: {
        "1k": {
          label: "1K TT",
          zones: {
            pace: [1 / 0.8, 1 / 0.9, 1, 1.05, 1.1],
            hr: [0.7, 0.8, 0.9, 0.95, 1],
          },
        },
        "5k": {
          label: "5K",
          zones: {
            pace: [1 / 0.75, 1 / 0.85, 1 / 0.95, 1 / 1.05, 1 / 1.15],
            hr: [0.7, 0.8, 0.9, 0.95, 1],
          },
        },
        "10k": {
          label: "10K",
          zones: {
            pace: [1 / 0.78, 1 / 0.88, 1 / 0.96, 1.05, 1.1],
            hr: [0.7, 0.8, 0.9, 0.95, 1],
          },
        },
      },
    },

    max: {
      tests: {
        hr: {
          label: "Max HR",
          zones: {
            hr: [0.6, 0.7, 0.8, 0.9, 1],
          },
        },
      },
    },

    race: {
      tests: {
        "5k": {
          label: "Race 5K",
          zones: {
            pace: [1 / 0.8, 1 / 0.9, 1, 1.05, 1.1],
          },
        },
      },
    },

    custom: {
      tests: {
        custom: {
          label: "Custom",
          zones: {
            pace: [0, 0, 0, 0, 0],
            hr: [0, 0, 0, 0, 0],
          },
        },
      },
    },
  },

  /* ================= BIKE ================= */

  bike: {
    threshold: {
      tests: {
        ftp: {
          label: "FTP",
          zones: {
            power: [0.55, 0.75, 0.9, 1.05, 1.2],
            hr: [0.7, 0.8, 0.9, 0.95, 1],
          },
        },
        "20min": {
          label: "20min",
          zones: {
            power: [0.6, 0.8, 0.9, 1.05, 1.15],
          },
        },
      },
    },

    max: {
      tests: {
        hr: {
          label: "Max HR",
          zones: {
            hr: [0.6, 0.7, 0.8, 0.9, 1],
          },
        },
      },
    },

    race: {
      tests: {
        ftp: {
          label: "Race FTP",
          zones: {
            power: [0.7, 0.85, 1, 1.1, 1.2],
          },
        },
      },
    },

    custom: {
      tests: {
        custom: {
          label: "Custom",
          zones: {
            power: [0, 0, 0, 0, 0],
            hr: [0, 0, 0, 0, 0],
          },
        },
      },
    },
  },

  /* ================= SWIM ================= */

  swim: {
    threshold: {
      tests: {
        css: {
          label: "CSS",
          zones: {
            pace: [1.2, 1.1, 1.05, 1, 0.95, 0.9, 0.85],
          },
        },
        "400m": {
          label: "400m",
          zones: {
            pace: [1 / 0.88, 1 / 0.95, 1, 1 / 1.05, 1 / 1.1],
          },
        },
      },
    },

    race: {
      tests: {
        "100m": {
          label: "100m",
          zones: {
            pace: [1 / 0.95, 1, 1 / 1.05, 1 / 1.1, 1 / 1.2],
          },
        },
      },
    },

    custom: {
      tests: {
        custom: {
          label: "Custom",
          zones: {
            pace: [0, 0, 0, 0, 0],
          },
        },
      },
    },
  },
};

/* ================= ENGINE ================= */

type BuildZonesParams = {
  sport: SportType;
  method: MethodType;
  testType: string;
  pace?: number;
  hr?: number;
  power?: number;
};

export function buildZones({
  sport,
  method,
  testType,
  pace,
  hr,
  power,
}: BuildZonesParams) {
  const methodConfig = ZONES_CONFIG[sport]?.[method];
  if (!methodConfig) return {};

  const testConfig = methodConfig.tests?.[testType];
  if (!testConfig) return {};

  const zones = testConfig.zones;

  const result: {
    pace?: number[];
    hr?: number[];
    power?: number[];
  } = {};

  if (zones.pace && pace !== undefined) {
    result.pace = zones.pace.map((f) => pace * f);
  }

  if (zones.hr && hr !== undefined) {
    result.hr = zones.hr.map((f) => hr * f);
  }

  if (zones.power && power !== undefined) {
    result.power = zones.power.map((f) => power * f);
  }

  return result;
}
