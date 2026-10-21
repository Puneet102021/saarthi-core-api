/*
  Preview routes take birth details in the body and need no sign-in, so they
  are off unless ENABLE_DEV_ROUTES=true. Never set it in production.
*/
export function devRoutesEnabled(): boolean {
  return process.env.ENABLE_DEV_ROUTES === "true";
}
