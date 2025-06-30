import { redirect } from "next/navigation";

export default function Home() {
  redirect("/symbols/EURUSD");

  return (
    <div className="">
      Redirecting to the symbol page...
    </div>
  );
}
