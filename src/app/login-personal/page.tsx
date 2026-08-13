import type { Metadata } from "next";
import LoginView from "@/components/views/LoginView";

export const metadata: Metadata = {
  title: "Acceso del Personal"
};

export default function LoginPersonalPage() {
  return <LoginView />;
}
