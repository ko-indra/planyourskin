import Breadcrumb from "@/components/layout/Breadcrumb";
import MyAccountDashboard from "./Dashboard";

export const metadata = { title: "My Account | PlanYourSkin" };

export default function MyAccountPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "My Account" }]} />
      <section className="mx-auto max-w-site px-4 py-12 md:px-[21px] md:py-16">
        <MyAccountDashboard />
      </section>
    </>
  );
}
