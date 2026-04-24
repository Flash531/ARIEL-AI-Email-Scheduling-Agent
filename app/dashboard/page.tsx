import { redirect } from "next/navigation";

// /dashboard is just a convenience alias — forward to the main app
export default function DashboardPage() {
  redirect("/");
}
