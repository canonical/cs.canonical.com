import { RuleConfigSeverity, type UserConfig } from "@commitlint/types";

const Configuration: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  formatter: "@commitlint/format",
  helpUrl:
    "Please make sure your commit message follows the conventional commit format: https://www.conventionalcommits.org/en/v1.0.0/",
  rules: {
    "type-enum": [
      RuleConfigSeverity.Error,
      "always",
      ["ci", "chore", "docs", "ticket", "feat", "fix", "perf", "ref", "refactor", "revert", "style", "test", "build"],
    ],
    "type-empty": [RuleConfigSeverity.Error, "always"],
    "subject-empty": [RuleConfigSeverity.Error, "always"],
  },
  plugins: [
    {
      rules: {
        "type-empty": (parsed) => {
          const { type } = parsed;
          if (type == null || type === "") return [false, `Commit type cannot be empty.`];
          return [true, ""];
        },
        "type-enum": (parsed, _when, expectedValues) => {
          const { type } = parsed;
          if (!type || !expectedValues.includes(type)) return [false, `Commit type must be one of: ${expectedValues}`];
          return [true, ""];
        },
        "subject-empty": (parsed) => {
          const { subject } = parsed;
          if (subject == null || subject === "") return [false, `Please provide a commit subject.`];
          return [true, ""];
        },
      },
    },
  ],
};

export default Configuration;
