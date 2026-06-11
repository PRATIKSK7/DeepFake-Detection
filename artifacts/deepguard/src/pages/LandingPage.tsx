import { Link } from "wouter";
import { motion } from "framer-motion";
import { Shield, Zap, Eye, BarChart3, Cpu, Lock, ArrowRight, CheckCircle } from "lucide-react";

const FEATURES = [
  {
    icon: Eye,
    title: "Grad-CAM Heatmaps",
    desc: "Visual attention maps show exactly which regions triggered the detection — pixel-level forensic transparency.",
  },
  {
    icon: Cpu,
    title: "4-Model Ensemble",
    desc: "EfficientNet-B4, XceptionNet, ViT, and GAN-Detector run in parallel. Weighted voting for maximum accuracy.",
  },
  {
    icon: Zap,
    title: "Batch Analysis",
    desc: "Upload and analyze up to 20 files simultaneously. Results stream in as each file completes.",
  },
  {
    icon: BarChart3,
    title: "MLOps Dashboard",
    desc: "Real-time model monitoring, detection trends, F1/precision/recall, and false positive rates.",
  },
  {
    icon: Lock,
    title: "Forensic Artifacts",
    desc: "Detailed breakdown of GAN fingerprints, blending boundaries, frequency artifacts, and face warping.",
  },
  {
    icon: Shield,
    title: "High Accuracy",
    desc: "Trained on FaceForensics++, DFDC, and DF-TIMIT datasets. 97%+ accuracy on held-out test sets.",
  },
];

const STATS = [
  { value: "97.4%", label: "Detection Accuracy" },
  { value: "<2s", label: "Avg Inference Time" },
  { value: "4 Models", label: "Ensemble Pipeline" },
  { value: "10+ Types", label: "Artifact Classes" },
];

const PIPELINE_STEPS = [
  { step: "01", label: "Upload", desc: "Drag & drop image or video" },
  { step: "02", label: "Preprocess", desc: "Resize, normalize, extract frames" },
  { step: "03", label: "Ensemble Inference", desc: "4 models run in parallel" },
  { step: "04", label: "Grad-CAM", desc: "Attention heatmap generated" },
  { step: "05", label: "Verdict", desc: "Weighted ensemble decision" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm tracking-wide">DEEPGUARD</span>
            <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 font-mono ml-1">MLOps Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Dashboard</span>
            </Link>
            <Link href="/models">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Models</span>
            </Link>
            <Link href="/analyze">
              <button className="bg-primary text-primary-foreground text-sm px-4 py-1.5 rounded font-medium hover:opacity-90 transition-opacity">
                Try it free
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(hsl(185 85% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(185 85% 50%) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        {/* Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 rounded-full px-4 py-1.5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-mono tracking-wider">4 models active — all systems operational</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl font-black tracking-tight text-foreground mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Detect Deep Fakes &
            <br />
            <span className="text-primary">AI-Generated Media</span>
            <br />
            with Forensic Precision
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Upload any image or video. Get a verdict in under 2 seconds — powered by a 4-model ensemble pipeline with Grad-CAM attention heatmaps showing exactly where manipulation was detected.
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link href="/analyze">
              <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                Start Analyzing
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 border border-border text-foreground px-6 py-3 rounded-lg font-semibold text-sm hover:bg-muted/30 transition-colors">
                View Dashboard
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <div className="text-3xl font-black text-primary font-mono">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ML Pipeline */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs text-primary font-mono uppercase tracking-widest mb-3">End-to-End MLOps Pipeline</div>
            <h2 className="text-3xl font-bold text-foreground">How it works</h2>
          </div>
          <div className="flex items-start gap-0">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.step} className="flex-1 relative">
                <div className="flex flex-col items-center text-center px-3">
                  <div className="w-10 h-10 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center mb-3 font-mono text-xs text-primary font-bold">
                    {step.step}
                  </div>
                  <div className="text-sm font-semibold text-foreground mb-1">{step.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{step.desc}</div>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-px border-t border-dashed border-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs text-primary font-mono uppercase tracking-widest mb-3">Platform Capabilities</div>
            <h2 className="text-3xl font-bold text-foreground">Built for serious forensic work</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-card border border-card-border rounded-xl p-5 hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <div className="w-8 h-8 rounded border border-primary/30 bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="text-sm font-semibold text-foreground mb-1.5">{f.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Model info */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs text-primary font-mono uppercase tracking-widest mb-3">Ensemble Architecture</div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Four models. One verdict.</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                No single model is right 100% of the time. Our weighted ensemble combines CNN, Transformer, and GAN-specific detectors — each bringing a different forensic lens to the same media.
              </p>
              <div className="space-y-2">
                {[
                  { name: "EfficientNet-B4-DeepFake", weight: "35%", type: "CNN", color: "bg-primary" },
                  { name: "XceptionNet-Forensics", weight: "30%", type: "CNN", color: "bg-blue-500" },
                  { name: "ViT-FaceForensics", weight: "25%", type: "Transformer", color: "bg-purple-500" },
                  { name: "GAN-Detector-Pro", weight: "10%", type: "Specialist", color: "bg-orange-500" },
                ].map((m) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                      <div className={`h-full ${m.color} rounded-full`} style={{ width: m.weight }} />
                    </div>
                    <div className="text-xs font-mono text-foreground">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground ml-auto">{m.weight}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-6 space-y-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Training Data & MLOps</div>
              {[
                "FaceForensics++ (1M+ manipulated frames)",
                "DFDC — DeepFake Detection Challenge",
                "DF-TIMIT identity-swap dataset",
                "CelebDF v2 high-quality deepfakes",
                "MLflow experiment tracking",
                "DVC dataset version control",
                "Grad-CAM visualization pipeline",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to analyze media?</h2>
          <p className="text-muted-foreground text-sm mb-8">Upload an image or video and get a forensic verdict in seconds.</p>
          <Link href="/analyze">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity mx-auto">
              Open Analyzer
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">DEEPGUARD</span>
          </div>
          <div className="text-xs text-muted-foreground font-mono">MLOps Platform v2.3.1 — EfficientNet-B4 · XceptionNet · ViT · GAN-Detector</div>
        </div>
      </footer>
    </div>
  );
}
