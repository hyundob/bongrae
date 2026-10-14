import { redirect } from "next/navigation";

// /rules → /about/rules (next.config.mjs 리다이렉트와 동일)
export default function LegacyRulesPage() {
  redirect("/about/rules");
}
