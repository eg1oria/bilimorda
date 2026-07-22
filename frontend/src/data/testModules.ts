export type TestModuleIcon = "users" | "brain" | "compass";
export type TestModuleTone = "violet" | "coral" | "blue";
export type TestModuleKey = 'teamRoles' | 'mbti' | 'riasec';

export type TestModule = {
  key: TestModuleKey;
  number: string;
  icon: TestModuleIcon;
  tone: TestModuleTone;
};

export const TEST_MODULES: TestModule[] = [
  {
    key: 'teamRoles',
    number: "01",
    icon: "users",
    tone: "violet",
  },
  {
    key: 'mbti',
    number: "02",
    icon: "brain",
    tone: "coral",
  },
  {
    key: 'riasec',
    number: "03",
    icon: "compass",
    tone: "blue",
  },
];
