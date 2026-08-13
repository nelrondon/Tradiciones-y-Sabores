import { redirect } from "next/navigation";

/** La puerta de entrada del sitio es el menú del cliente. */
export default function IndexPage() {
  redirect("/menu");
}
