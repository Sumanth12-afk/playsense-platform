// Type declaration for dotenv (module may be hoisted in monorepo)
declare module 'dotenv' {
  export function config(options?: { path?: string }): { parsed?: Record<string, string> };
}
