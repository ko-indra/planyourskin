import Breadcrumb from "@/components/layout/Breadcrumb";
import OrderDetail from "./OrderDetail";

export const metadata = { title: "Order Detail | PlanYourSkin" };

export default function OrderDetailPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "My Account", href: "/my-account" },
          { label: `Order #${params.orderNumber}` },
        ]}
      />
      <section className="mx-auto max-w-site px-4 py-12 md:px-[21px] md:py-16">
        <OrderDetail orderNumber={params.orderNumber} />
      </section>
    </>
  );
}
