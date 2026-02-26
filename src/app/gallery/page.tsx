import Link from "next/link";
import type { Metadata } from "next";
import { getDevCardData } from "@/data";
import { GALLERY_USERS } from "@/data/gallery-users";
import GalleryGrid from "./gallery-grid";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gallery — DevCard",
  description: "DevCards for notable developers",
};

export default async function GalleryPage() {
  const results = await Promise.allSettled(
    GALLERY_USERS.map((u) => getDevCardData(u.username))
  );

  const cards = GALLERY_USERS.map((user, i) => {
    const result = results[i];
    if (result.status === "fulfilled") {
      return { user, data: result.value };
    }
    return null;
  }).filter(Boolean) as { user: (typeof GALLERY_USERS)[0]; data: Awaited<ReturnType<typeof getDevCardData>> }[];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Gallery</h1>
        <p className="text-gray-400 mb-10">Cards generated for notable developers</p>
        <GalleryGrid cards={cards} />
        <div className="mt-12 text-center">
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
            ← Generate your own card
          </Link>
        </div>
      </div>
    </main>
  );
}
