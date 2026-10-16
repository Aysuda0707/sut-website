"use client";

import { CollectionManager, type FieldDef } from "@/components/admin/CollectionManager";

const fields: FieldDef[] = [
  { name: "title", label: "عنوان", type: "text", required: true },
  { name: "slug", label: "نشانی (slug)", type: "text", hint: "اگر خالی بماند از عنوان ساخته می‌شود." },
  { name: "intervieweeName", label: "نام مصاحبه‌شونده", type: "text" },
  { name: "fieldOfStudy", label: "رشته تحصیلی", type: "text" },
  { name: "recordingYear", label: "سال ضبط", type: "number" },
  { name: "publishDate", label: "تاریخ انتشار", type: "date" },
  { name: "summary", label: "خلاصه", type: "textarea" },
  { name: "transcript", label: "متن پیاده‌شده", type: "textarea" },
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
  { name: "consentConfirmed", label: "رضایت مصاحبه‌شونده تأیید شد", type: "checkbox" },
  { name: "featuredImage", label: "تصویر شاخص", type: "media", mediaTypes: ["image"] },
  { name: "videoFile", label: "فایل ویدیو", type: "media", mediaTypes: ["video"] },
  { name: "tags", label: "برچسب‌ها", type: "tags", taxonomy: "tags" },
];

export default function AdminInterviewsPage() {
  return (
    <CollectionManager
      collection="interviews"
      title="گفت‌وگوها"
      lead="مصاحبه‌های تصویری با دانش‌آموختگان و اعضا."
      fields={fields}
      labelField="title"
      secondaryField="intervieweeName"
      slugFrom="title"
      emptyRecord={() => ({
        title: "",
        slug: "",
        intervieweeName: "",
        fieldOfStudy: "",
        recordingYear: new Date().getFullYear(),
        publishDate: "",
        summary: "",
        transcript: "",
        status: "draft",
        consentConfirmed: false,
        featuredImage: null,
        videoFile: null,
        tags: [],
      })}
    />
  );
}
