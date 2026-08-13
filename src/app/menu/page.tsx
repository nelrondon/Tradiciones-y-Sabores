import CustomerMenuView from "@/components/views/CustomerMenuView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu"
};

export default function CustomerMenuPage() {
  return <CustomerMenuView />;
}
