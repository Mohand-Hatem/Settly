export interface IdentityUser {
  id: string;
  email: string;
  role: "USER" | "AGENT" | "ADMIN";
  banned?: boolean;
}
