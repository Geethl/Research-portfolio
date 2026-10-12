import { createFileRoute } from "@tanstack/react-router";
import AcousticMonitor from "@/components/AcousticMonitor";

export const Route = createFileRoute("/")({
  component: AcousticMonitor,
  head: () => ({
    meta: [
      { title: "Gaja-Saviya · Acoustic Intent Monitoring" },
      {
        name: "description",
        content:
          "Real-time elephant acoustic intent monitoring — waveform visualizer, AI classification, and SOS alerts.",
      },
    ],
  }),
});
