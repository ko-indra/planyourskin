import fs from "node:fs/promises";
import path from "node:path";
import Breadcrumb from "@/components/layout/Breadcrumb";

export const metadata = { title: "Refund Policy | PlanYourSkin" };

async function loadHtml() {
  const file = path.join(process.cwd(), "content", "pages", "refund-policy.json");
  return JSON.parse(await fs.readFile(file, "utf-8")) as { title: string; html: string };
}

export default async function RefundPolicyPage() {
  const { title, html } = await loadHtml();
  return (
    <>
      <Breadcrumb items={[{ label: title }]} />
      <article className="mx-auto max-w-site px-4 py-10 md:px-[21px] md:py-16">
        <h1 className="mb-8 text-[32px] font-semibold leading-[1.2] text-[#222529] md:text-[33px]">
          {title}
        </h1>
        <div
          className="prose prose-neutral max-w-none
            prose-headings:font-semibold prose-headings:text-[#222529]
            prose-p:text-justify prose-p:text-[#777] prose-p:leading-[25px] prose-p:text-[15px]
            prose-li:text-justify prose-li:text-[#777] prose-li:leading-[25px] prose-li:text-[15px]
            prose-strong:text-[#222529]
            prose-a:text-brand
            [&_b]:font-semibold [&_b]:text-[#222529]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </>
  );
}
