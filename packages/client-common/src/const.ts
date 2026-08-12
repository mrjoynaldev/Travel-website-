// Navigate to the sign-in page. Authentication uses Supabase email/password
// against the platform's Supabase project.
export const startLogin = () => {
  if (typeof window === "undefined") return;
  window.location.href = "/login";
};
