"use client";

import { CollectionManager, type FieldDef } from "@/components/admin/CollectionManager";

const fields: FieldDef[] = [
  { name: "title", label: "عنوان", type: "text", required: true },
  { name: "slug", label: "نشانی (slug)", type: "text", hint: "اگر خالی بماند از عنوان ساخته می‌شود." },
  { name: "authorDisplayName", label: "نویسنده", type: "text" },
  { name: "publishDate", label: "تاریخ انتشار", type: "date" },
  { name: "summary", label: "خلاصه", type: "textarea" },
  { name: "body", label: "متن (HTML)", type: "textarea" },
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
  { name: "featuredImage", label: "تصویر شاخص", type: "media", mediaTypes: ["image"] },
  { name: "categories", label: "دسته‌ها", type: "tags", taxonomy: "categories" },
  { name: "tags", label: "برچسب‌ها", type: "tags", taxonomy: "tags" },
];

export default function AdminArticlesPage() {
  return (
    <CollectionManager
      collection="articles"
      title="نوشته‌ها"
      lead="یادداشت‌ها، مقاله‌ها و روایت‌های آرشیو."
      fields={fields}
      labelField="title"
      secondaryField="publishDate"
      slugFrom="title"
      emptyRecord={() => ({
        title: "",
        slug: "",
        authorDisplayName: "",
        publishDate: "",
        summary: "",
        body: "",
        status: "draft",
        featuredImage: null,
        inlineMedia: [],
        categories: [],
        tags: [],
      })}
    />
  );
}
