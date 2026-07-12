import type { Metadata } from "next";
import { AdvertiseContent } from "@/components/advertise/AdvertiseContent";

export const metadata: Metadata = {
  title: "إعلن هنا",
  description: "أعلن عن محلك في تطبيق ذهب مصر ووصل لأكبر شريحة من المستهدفين",
};

export default function AdvertisePage() {
  return <AdvertiseContent />;
}
