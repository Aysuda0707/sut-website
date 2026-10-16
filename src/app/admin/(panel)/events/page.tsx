"use client";

import { CollectionManager, type FieldDef } from "@/components/admin/CollectionManager";

const fields: FieldDef[] = [
  { name: "title", label: "عنوان", type: "text", required: true },
  { name: "slug", label: "نشانی (slug)", type: "text", hint: "اگر خالی بماند از عنوان ساخته می‌شود." },
  { name: "eventType", label: "نوع رویداد", type: "text" },
  { name: "eventDate", label: "تاریخ رویداد", type: "date" },
  { name: "archiveYear", label: "سال آرشیو", type: "number" },
  { name: "location", label: "مکان", type: "text" },
  { name: "summary", label: "خلاصه", type: "textarea" },
  { name: "reportBody", label: "متن گزارش", type: "textarea" },
  {
    name: "status",
    label: "وضعیت",
    type: "select",
    options: [
      { value: "draft", label: "پیش‌نویس" },
      { value: "published", label: "منتشرشده" },
      { value: "archived", label: "بایگانی" },
    ],
  },
  { name: "featuredOnHome", label: "نمایش در صفحه اصلی", type: "checkbox" },
  { name: "featuredImage", label: "تصویر شاخص", type: "media", mediaTypes: ["image"] },
  { name: "categories", label: "دسته‌ها", type: "tags", taxonomy: "categories" },
  { name: "tags", label: "برچسب‌ها", type: "tags", taxonomy: "tags" },
];

export default function AdminEventsPage() {
  return (
    <CollectionManager
      collection="events"
      title="رویدادها"
      lead="رویدادها، گزارش‌ها و آرشیو سالانه."
      fields={fields}
      labelField="title"
      secondaryField="eventDate"
      slugFrom="title"
      emptyRecord={() => ({
        title: "",
        slug: "",
        eventType: "",
        eventDate: "",
        archiveYear: new Date().getFullYear(),
        location: "",
        summary: "",
        reportBody: "",
        status: "draft",
        featuredOnHome: false,
        featuredImage: null,
        gallery: [],
        categories: [],
        tags: [],
      })}
    />
  );
}
