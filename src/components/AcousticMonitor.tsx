import { useEffect, useMemo, useState, useRef } from "react";
import {
  Mic,
  Volume2,
  Home,
  MapPin,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Play,
  Square,
  Bird,
  CloudRain,
  Feather
} from "lucide-react";

type Status = "Elephant (Aggressive)" | "Elephant (Social)" | "Peacock" | "Birds" | "Rain" | "Ambient";

function Waveform({ accent, audioData }: { accent: string, audioData: Uint8Array | null }) {
  const bars = useMemo(() => Array.from({ length: 56 }), []);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    if (audioData) return;
    const t = setInterval(() => setSeed((s) => s + 1), 110);
    return () => clearInterval(t);
  }, [audioData]);

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-secondary to-background border border-border">
      <div className="absolute inset-0 flex items-center justify-between gap-[2px] px-3">
        {bars.map((_, i) => {
          let h = 0;
          if (audioData) {
            const dataIndex = Math.floor((i / 56) * audioData.length);
            const val = audioData[dataIndex] || 0;
            h = (val / 255) * 100;
          } else {
            const base = Math.abs(Math.sin((i + seed) * 0.55)) * 0.7 + 0.15;
            const spike = Math.abs(Math.sin((i * 3 + seed * 1.7) * 0.3)) * 0.45;
            h = Math.min(1, base + spike) * 100;
          }

          return (
            <div
              key={i}
              className="flex-1 rounded-full transition-[height] duration-75 ease-out"
              style={{
                height: `${Math.max(2, h)}%`,
                background: accent,
                opacity: 0.85,
              }}
            />
          );
        })}
      </div>
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-foreground border border-border">
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full ${audioData ? 'animate-ping' : ''} rounded-full ${audioData ? 'bg-green-500' : 'bg-primary'} opacity-75`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${audioData ? 'bg-green-500' : 'bg-primary'}`} />
        </span>
        Input: {audioData ? 'Live Microphone' : 'Standby'}
      </div>
    </div>
  );
}

function ElephantIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 36c0-10 8-18 19-18s19 8 19 18v10h-8v-6h-6v6H24v-6h-6v6h-8z" />
      <path d="M48 36c4 0 6 3 6 6s-2 6-6 6" />
      <path d="M22 30c0-2 2-4 4-4" />
      <circle cx="22" cy="30" r="1.4" fill={color} stroke="none" />
    </svg>
  );
}

function StatusIcon({ status, color }: { status: Status, color: string }) {
  if (status.includes("Elephant")) return <ElephantIcon color={color} />;
  if (status === "Peacock") return <Feather className="h-16 w-16" style={{ color }} />;
  if (status === "Birds") return <Bird className="h-16 w-16" style={{ color }} />;
  if (status === "Rain") return <CloudRain className="h-16 w-16" style={{ color }} />;
  return <Mic className="h-16 w-16" style={{ color }} />; // Ambient
}

export default function AcousticMonitor() {
  const [status, setStatus] = useState<Status>("Ambient");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>(0);

  const getAccentColor = (s: Status) => {
    switch (s) {
      case "Elephant (Aggressive)": return "var(--color-destructive)"; // Red
      case "Elephant (Social)": return "var(--color-primary)"; // Green
      case "Peacock": return "#9333ea"; // Purple
      case "Birds": return "#eab308"; // Yellow
      case "Rain": return "#3b82f6"; // Blue
      default: return "#9ca3af"; // Gray
    }
  };

  const accent = getAccentColor(status);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 8192; 
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      
      setIsMonitoring(true);
      analyzeAudio();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to use live monitoring.");
    }
  };

  const stopMonitoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    setIsMonitoring(false);
    setAudioData(null);
    setStatus("Ambient");
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    setAudioData(new Uint8Array(dataArray));
    
    const sampleRate = audioContextRef.current.sampleRate;
    const binSize = sampleRate / analyserRef.current.fftSize;

    let socialEnergy = 0;
    let aggressiveEnergy = 0;
    let peacockEnergy = 0;
    let birdEnergy = 0;
    let noiseEnergy = 0;

    for (let i = 0; i < bufferLength; i++) {
      const freq = i * binSize;
      const val = dataArray[i];

      if (freq >= 14 && freq <= 24) socialEnergy += val;
      if (freq >= 20 && freq <= 200) aggressiveEnergy += val;
      if (freq >= 1000 && freq <= 3000) peacockEnergy += val;
      if (freq >= 3000 && freq <= 8000) birdEnergy += val;
      if (freq > 100 && freq <= 1000) noiseEnergy += val; // Broadband noise
    }

    const socialAvg = socialEnergy / Math.max(1, Math.floor((24 - 14) / binSize));
    const aggressiveAvg = aggressiveEnergy / Math.max(1, Math.floor((200 - 20) / binSize));
    const peacockAvg = peacockEnergy / Math.max(1, Math.floor((3000 - 1000) / binSize));
    const birdAvg = birdEnergy / Math.max(1, Math.floor((8000 - 3000) / binSize));
    const noiseAvg = noiseEnergy / Math.max(1, Math.floor((1000 - 100) / binSize));

    // Priority Detection Logic
    if (aggressiveAvg > 40 || (noiseAvg > 30 && aggressiveAvg > 20)) {
      setStatus("Elephant (Aggressive)");
    } else if (peacockAvg > 45) {
      setStatus("Peacock");
    } else if (birdAvg > 35) {
      setStatus("Birds");
    } else if (noiseAvg > 15 && birdAvg < 20 && peacockAvg < 20 && aggressiveAvg < 15) {
      setStatus("Rain");
    } else if (socialAvg > 10) { 
      setStatus("Elephant (Social)");
    } else {
      setStatus("Ambient");
    }
    
    requestRef.current = requestAnimationFrame(analyzeAudio);
  };

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-28">
      {/* Header */}
      <header className="px-5 pt-6 pb-3 flex justify-between items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Gaja-Saviya · Component 2
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Acoustic Intent Monitoring
          </h1>
        </div>
        <button 
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          className={`p-2 rounded-full flex items-center justify-center transition-colors ${isMonitoring ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}
        >
          {isMonitoring ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
      </header>

      {/* Waveform */}
      <section className="px-5">
        <Waveform accent={accent} audioData={audioData} />
      </section>

      {/* Status card */}
      <section className="px-5 mt-5">
        <div
          className="relative rounded-3xl bg-card p-6 transition-colors duration-500"
          style={{ border: `2px solid ${accent}`, boxShadow: `0 12px 30px -18px ${accent}` }}
        >
          {/* Ripples */}
          <div className="pointer-events-none absolute left-1/2 top-[88px] -translate-x-1/2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  border: `2px solid ${accent}`,
                  animation: isMonitoring ? `ripple 2s ease-out ${i * 0.6}s infinite` : 'none',
                  opacity: isMonitoring ? 1 : 0
                }}
              />
            ))}
          </div>

          <div className="relative flex flex-col items-center">
            <div
              className="flex h-32 w-32 items-center justify-center rounded-full transition-colors duration-500"
              style={{ background: status === "Ambient" ? "#1f2937" : `${accent}20` }}
            >
              <StatusIcon status={status} color={accent} />
            </div>

            <div className="mt-5 flex items-center gap-2">
              {status === "Elephant (Aggressive)" ? (
                <AlertTriangle className="h-4 w-4" style={{ color: accent }} />
              ) : (
                <CheckCircle2 className="h-4 w-4" style={{ color: accent }} />
              )}
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Current Detection
              </span>
            </div>
            <p className="mt-1 text-xl font-bold transition-colors duration-500 text-center" style={{ color: accent }}>
              {status.toUpperCase()}
            </p>

            <div className="mt-5 h-2 w-12 rounded-full transition-colors duration-500" style={{ background: accent }} />

            {!isMonitoring && (
              <div className="mt-4 text-xs text-center text-muted-foreground">
                Press the Start Monitoring button to begin live microphone analysis.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="px-5 mt-5 flex items-center gap-3">
        <button 
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-sm active:scale-[0.98] transition"
        >
          {isMonitoring ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          {isMonitoring ? "Stop Monitoring" : "Start Live Monitoring"}
        </button>
      </section>

      {/* History */}
      <section className="px-5 mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent Detections</h2>
          <span className="text-xs text-muted-foreground">Today</span>
        </div>
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-border divide-y divide-border bg-card">
          {[
            { time: "10:05 AM", kind: "Elephant (Social)" },
            { time: "09:30 AM", kind: "Elephant (Aggressive)" },
            { time: "08:47 AM", kind: "Peacock" },
            { time: "07:12 AM", kind: "Rain" },
          ].map((d) => {
            const c = getAccentColor(d.kind as Status);
            return (
              <div key={d.time} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: `${c}20` }}
                >
                  <StatusIcon status={d.kind as Status} color={c} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{d.kind}</p>
                  <p className="text-xs text-muted-foreground">{d.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto max-w-md border-t border-border bg-background/90 backdrop-blur">
          <div className="grid grid-cols-5 px-2 py-2">
            {[
              { icon: Home, label: "Home" },
              { icon: MapPin, label: "Map" },
              { icon: Mic, label: "Listen", active: true },
              { icon: BarChart3, label: "Stats" },
              { icon: Settings, label: "Settings" },
            ].map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                className="flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium"
                style={{ color: active ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)" }}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-2xl transition"
                  style={{
                    background: active ? "var(--color-primary)" : "transparent",
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: active ? "var(--color-primary-foreground)" : "var(--color-primary)" }}
                  />
                </span>
                <span style={{ color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
