import type { Metadata } from "next";
import { WorkerPreview } from "@/components/worker/worker-preview";
import { MapSchema } from "@/contracts";
import mapSource from "../../data/maps/site-construction-01.json";

export const metadata: Metadata = {
  title: "Worker browser preview | GS Safety Operations",
  description:
    "작업자 안내와 응답을 연결하는 브라우저 미리보기. Android 실제 앱 검증과 별개입니다.",
};

export default function WorkerPage() {
  return <WorkerPreview map={MapSchema.parse(mapSource)} />;
}
