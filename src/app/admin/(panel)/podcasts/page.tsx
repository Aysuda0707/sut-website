"use client";

import { CollectionManager, type FieldDef } from "@/components/admin/CollectionManager";

const fields: FieldDef[] = [
  { name: "title", label: "عنوان", type: "text", required: true },
  { name: "slug", label: "نشانی (slug)", type: "text", hint: "اگر خالی بماند از عنوان ساخته می‌شود." },
  { name: "episodeNumber", label: "شماره قسمت", type: "number" },
  { name: "season", label: "فصل", type: "number" },
  { name: "publishDate", label: "تاریخ انتشار", type: "date" },
  { name: "durationSeconds", label: "مدت (ثانیه)", type: "number" },
  { name: "shortDescription", label: "توضیح کوتاه", type: "textarea" },
  { name: "longDescription", label: "توضیح کامل", type: "textarea" },
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
  { name: "coverImage", label: "تصویر جلد", type: "media", mediaTypes: ["image"] },
  { name: "audioFile", label: "فایل صوتی", type: "media", mediaTypes: ["audio"] },
  { name: "tags", label: "برچسب‌ها", type: "tags", taxonomy: "tags" },
];

export default function AdminPodcastsPage() {
  return (
    <CollectionManager
      collection="podcasts"
      title="پادکست"
      lead="قسمت‌های پادکست همراه با فایل صوتی."
      fields={fields}
      labelField="title"
      secondaryField="publishDate"
      slugFrom="title"
      emptyRecord={() => ({
        title: "",
        slug: "",
        episodeNumber: 1,
        season: 1,
        publishDate: "",
        durationSeconds: 0,
        shortDescription: "",
        longDescription: "",
        transcript: "",
        status: "draft",
        coverImage: null,
        audioFile: null,
        tags: [],
      })}
    />
  );
}
