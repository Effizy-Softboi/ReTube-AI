import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Download, Sparkles, Youtube, Loader2, Copy, Check, 
  ExternalLink, RefreshCw, Volume2, Video, Key, Menu, X, 
  ChevronRight, Github, Twitter, Linkedin, Globe, Zap, Shield, Cpu
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import Lottie from 'lottie-react';
import animationData from './lottie-video.json';
import { analyzeAndOptimize, recreateAudio, startVideoRecreation, pollVideoStatus, OptimizedContent } from './services/geminiService';

interface VideoInfo {
  title: string;
  description: string;
  thumbnail: string;
  author: string;
  duration: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const NavItem = ({ label, href }: { label: string; href: string }) => (
  <a 
    href={href} 
    className="text-sm font-medium text-white/50 hover:text-indigo-400 transition-all duration-300 hover:translate-x-1 flex items-center gap-1 group"
  >
    {label}
    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
  </a>
);

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [optimized, setOptimized] = useState<OptimizedContent | null>(null);
  const [recreatedAudio, setRecreatedAudio] = useState<string | null>(null);
  const [recreatedVideoUrl, setRecreatedVideoUrl] = useState<string | null>(null);
  const [recreatingVideo, setRecreatingVideo] = useState(false);
  const [recreationProgress, setRecreationProgress] = useState(0);
  const [recreationStatus, setRecreationStatus] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    window.aistudio.hasSelectedApiKey().then(setHasKey);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setVideoInfo(null);
    setOptimized(null);
    setRecreatedAudio(null);
    setRecreatedVideoUrl(null);

    try {
      const response = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch video info');

      setVideoInfo(data);
      
      const optimizedContent = await analyzeAndOptimize(data.title, data.description);
      setOptimized(optimizedContent);

      const audioData = await recreateAudio(optimizedContent.script);
      setRecreatedAudio(audioData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecreateVideo = async () => {
    if (!optimized) return;
    
    const hasApiKey = await window.aistudio.hasSelectedApiKey();
    if (!hasApiKey) {
      await window.aistudio.openSelectKey();
      return;
    }

    setRecreatingVideo(true);
    setRecreationProgress(10);
    setRecreationStatus('Initializing AI Engine...');
    setError('');
    
    try {
      let operation = await startVideoRecreation(optimized.recreationPrompt);
      setRecreationProgress(30);
      setRecreationStatus('Generating Visual Frames...');
      
      let pollCount = 0;
      while (!operation.done) {
        pollCount++;
        // Simulate progress while polling
        const simulatedProgress = Math.min(30 + (pollCount * 5), 95);
        setRecreationProgress(simulatedProgress);
        setRecreationStatus(pollCount > 5 ? 'Polishing Visuals...' : 'Rendering AI Video...');
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await pollVideoStatus(operation);
      }

      setRecreationProgress(100);
      setRecreationStatus('Video Ready!');
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setRecreatedVideoUrl(downloadLink);
      }
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setError("API Key issue. Please re-select your key.");
        await window.aistudio.openSelectKey();
      } else {
        setError("Video recreation failed. Please try again.");
      }
    } finally {
      setRecreatingVideo(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Header */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 group cursor-pointer">
              <RefreshCw className="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-700" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight block leading-none">ReTube <span className="text-indigo-500">AI</span></span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">By Effangha Edem Tech</span>
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavItem label="Home" href="#" />
            <NavItem label="Technology" href="#tech" />
            <NavItem label="Showcase" href="#showcase" />
            <NavItem label="Pricing" href="#pricing" />
            <div className="h-4 w-px bg-white/10 mx-2" />
            {!hasKey ? (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.aistudio.openSelectKey()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                <Key className="w-3.5 h-3.5" />
                Connect API
              </motion.button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-400 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                API Connected
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-white/50 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0a0a0a] border-b border-white/5 overflow-hidden"
            >
              <div className="px-6 py-8 flex flex-col gap-6">
                <NavItem label="Home" href="#" />
                <NavItem label="Technology" href="#tech" />
                <NavItem label="Showcase" href="#showcase" />
                <NavItem label="Pricing" href="#pricing" />
                <button 
                  onClick={() => window.aistudio.openSelectKey()}
                  className="w-full py-4 bg-indigo-600 rounded-2xl font-bold text-sm"
                >
                  Connect API Key
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[800px] pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full" />
        </div>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 relative z-10" ref={heroRef}>
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-10 shadow-inner"
            >
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Video Synthesis
            </motion.div>
            
            <motion.div style={{ y: y1, opacity }}>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-bold mb-10 tracking-tighter leading-[0.9] max-w-4xl mx-auto"
              >
                Recreate Content. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 drop-shadow-sm">
                  Zero Copyright.
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/40 text-xl max-w-2xl mx-auto font-light leading-relaxed mb-12"
              >
                Our proprietary AI engine analyzes the creative essence of any video and synthesizes a completely unique, copyright-safe masterpiece.
              </motion.p>
            </motion.div>

            {/* Search Input */}
            <motion.form 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSearch}
              className="relative max-w-3xl mx-auto group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative flex items-center bg-[#111]/80 backdrop-blur-2xl rounded-[2rem] border border-white/10 p-2.5 shadow-2xl">
                <div className="pl-6 text-white/20">
                  <Youtube className="w-7 h-7" />
                </div>
                <input 
                  type="text" 
                  placeholder="Paste YouTube URL to recreate..." 
                  className="w-full bg-transparent px-6 py-6 outline-none text-xl placeholder:text-white/10 font-light"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white px-12 py-6 rounded-2xl font-bold transition-all flex items-center gap-3 shadow-xl shadow-indigo-600/30"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
                  {loading ? 'Analyzing...' : 'Recreate'}
                </motion.button>
              </div>
            </motion.form>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-3xl mb-16 flex items-center gap-4 max-w-3xl mx-auto backdrop-blur-md"
            >
              <div className="bg-red-500/20 p-2.5 rounded-full flex-shrink-0">
                <X className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* Results Section */}
          <AnimatePresence>
            {videoInfo && (
              <motion.div 
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-20"
              >
                {/* Analysis Grid */}
                <div className="grid lg:grid-cols-12 gap-12 items-start">
                  {/* Left Column: Source & Action */}
                  <div className="lg:col-span-4 space-y-8">
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl group"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <img 
                          src={videoInfo.thumbnail} 
                          alt="" 
                          className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-700" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                      </div>
                      <div className="p-8">
                        <h3 className="font-bold text-xl mb-3 line-clamp-2 leading-tight">{videoInfo.title}</h3>
                        <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                          <Youtube className="w-3 h-3" /> Original Source
                        </div>
                      </div>
                    </motion.div>
                    
                    <div className="space-y-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleRecreateVideo}
                        disabled={recreatingVideo || !!recreatedVideoUrl}
                        className="w-full py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 rounded-[2rem] font-bold flex flex-col items-center justify-center gap-2 transition-all shadow-2xl shadow-indigo-500/20 relative overflow-hidden group"
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          {recreatingVideo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Video className="w-6 h-6" />}
                          <span className="text-lg">{recreatingVideo ? 'Synthesizing...' : recreatedVideoUrl ? 'Recreation Complete' : 'Synthesize AI Visuals'}</span>
                        </div>
                        
                        {/* Progress Bar Background */}
                        {recreatingVideo && (
                          <motion.div 
                            className="absolute bottom-0 left-0 h-1.5 bg-white/30 z-20"
                            initial={{ width: 0 }}
                            animate={{ width: `${recreationProgress}%` }}
                          />
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </motion.button>

                      {recreatingVideo && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center space-y-3"
                        >
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-400 px-2">
                            <span>{recreationStatus}</span>
                            <span>{Math.round(recreationProgress)}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                              initial={{ width: 0 }}
                              animate={{ width: `${recreationProgress}%` }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: AI Assets */}
                  <div className="lg:col-span-8 space-y-12">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full" />
                      
                      <div className="flex items-center justify-between mb-12">
                        <h2 className="text-3xl font-bold flex items-center gap-4">
                          <div className="bg-indigo-500/20 p-2.5 rounded-2xl">
                            <Cpu className="w-7 h-7 text-indigo-400" />
                          </div>
                          AI Synthesis Output
                        </h2>
                      </div>

                      {!optimized ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-6">
                          <div className="w-24 h-24">
                            <Lottie animationData={animationData} loop={true} />
                          </div>
                          <p className="text-white/20 font-light tracking-wide animate-pulse">Deconstructing creative DNA...</p>
                        </div>
                      ) : (
                        <div className="space-y-12">
                          {/* Title */}
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">Viral Title Synthesis</span>
                              <button 
                                onClick={() => copyToClipboard(optimized.viralTitle, 't')} 
                                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-90"
                              >
                                {copied === 't' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/30" />}
                              </button>
                            </div>
                            <p className="text-4xl font-bold tracking-tighter leading-[1.1]">{optimized.viralTitle}</p>
                          </motion.div>

                          {/* Audio */}
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-4"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">Audio Reconstruction</span>
                            <div className="bg-white/5 rounded-3xl p-6 flex items-center gap-6 border border-white/5 group">
                              <div className="bg-indigo-500/20 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                                <Volume2 className="w-8 h-8 text-indigo-400" />
                              </div>
                              <div className="flex-1">
                                {recreatedAudio ? (
                                  <audio controls src={`data:audio/mp3;base64,${recreatedAudio}`} className="w-full h-10 custom-audio" />
                                ) : (
                                  <div className="flex items-center gap-3 text-white/20 text-sm font-light">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing neural voiceover...
                                  </div>
                                )}
                              </div>
                              {recreatedAudio && (
                                <motion.a 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  href={`data:audio/mp3;base64,${recreatedAudio}`} 
                                  download="voiceover.mp3"
                                  className="p-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
                                >
                                  <Download className="w-6 h-6" />
                                </motion.a>
                              )}
                            </div>
                          </motion.div>

                          {/* Video */}
                          <AnimatePresence>
                            {recreatedVideoUrl && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4"
                              >
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">AI Visual Synthesis</span>
                                <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
                                  <video src={recreatedVideoUrl} controls className="w-full aspect-video bg-black" />
                                  <motion.a 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    href={recreatedVideoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="absolute top-6 right-6 p-4 bg-black/60 backdrop-blur-xl hover:bg-black/80 rounded-2xl transition-all border border-white/10"
                                  >
                                    <Download className="w-6 h-6" />
                                  </motion.a>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Description */}
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">SEO Metadata Synthesis</span>
                              <button 
                                onClick={() => copyToClipboard(optimized.seoDescription, 'd')} 
                                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-90"
                              >
                                {copied === 'd' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/30" />}
                              </button>
                            </div>
                            <div className="bg-white/5 rounded-[2rem] p-10 border border-white/5">
                              <p className="text-white/50 text-base leading-relaxed whitespace-pre-wrap font-light italic">
                                {optimized.seoDescription}
                              </p>
                            </div>
                          </motion.div>

                          {/* Tags */}
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-4"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400">Algorithmic Tags</span>
                            <div className="flex flex-wrap gap-3">
                              {optimized.tags.map((tag, i) => (
                                <motion.span 
                                  key={i} 
                                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(99,102,241,0.1)' }}
                                  className="px-5 py-2.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-white/40 uppercase tracking-widest cursor-default transition-all"
                                >
                                  #{tag.replace(/\s+/g, '')}
                                </motion.span>
                              ))}
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Features Section */}
        <section id="tech" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
          <div className="grid md:grid-cols-3 gap-16">
            {[
              { 
                title: 'Visual Synthesis', 
                desc: 'Our AI generates entirely new visuals based on the original content, ensuring 100% copyright safety through creative re-imagination.', 
                icon: Video,
                color: 'text-indigo-400'
              },
              { 
                title: 'Neural Audio', 
                desc: 'Professional-grade text-to-speech recreates the audio script with natural-sounding voices, customized for your brand tone.', 
                icon: Volume2,
                color: 'text-purple-400'
              },
              { 
                title: 'Algorithmic SEO', 
                desc: 'Titles and descriptions are engineered using advanced LLMs to trigger the YouTube recommendation engine and maximize reach.', 
                icon: Sparkles,
                color: 'text-pink-400'
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="bg-white/5 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-10 group-hover:bg-white/10 transition-all duration-500 group-hover:rotate-6 shadow-xl">
                  <f.icon className={`w-10 h-10 ${f.color}`} />
                </div>
                <h3 className="text-2xl font-bold mb-6 tracking-tight group-hover:text-indigo-400 transition-colors">{f.title}</h3>
                <p className="text-white/30 text-base leading-relaxed font-light">{f.desc}</p>
                <div className="absolute -bottom-4 left-0 w-0 h-0.5 bg-indigo-500 group-hover:w-full transition-all duration-700" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Trust Section */}
        <section className="bg-white/5 py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-16">
              <div className="max-w-xl">
                <h2 className="text-4xl font-bold mb-8 tracking-tight">Trusted by Content Creators Worldwide</h2>
                <p className="text-white/40 text-lg font-light leading-relaxed mb-10">
                  Join thousands of creators who are scaling their channels safely with ReTube AI's proprietary synthesis technology.
                </p>
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-400 mb-1">500K+</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Videos Recreated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">99.9%</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Safety Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-400 mb-1">10M+</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Views Generated</div>
                  </div>
                </div>
              </div>
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-indigo-600/20 blur-[100px] rounded-full animate-pulse" />
                <div className="relative bg-[#111] border border-white/10 rounded-[3rem] p-10 shadow-2xl h-full flex items-center justify-center">
                  <div className="text-center space-y-6">
                    <Shield className="w-20 h-20 text-indigo-500 mx-auto mb-4" />
                    <h4 className="text-xl font-bold">Copyright Protection</h4>
                    <p className="text-white/30 text-sm font-light">Our engine ensures every frame is unique and legally safe.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/5 pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-16 mb-24">
            <div className="md:col-span-4 space-y-8">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-2xl">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold tracking-tight text-2xl">ReTube AI</span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed font-light max-w-xs">
                The world's most advanced AI video synthesis platform for creators who want to scale without boundaries.
              </p>
              <div className="flex gap-5">
                {[Twitter, Github, Linkedin, Globe].map((Icon, i) => (
                  <motion.a 
                    key={i}
                    whileHover={{ y: -3, color: '#6366f1' }}
                    href="#" 
                    className="text-white/20 transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-white/20">Product</h4>
              <ul className="space-y-4">
                {['Features', 'Technology', 'Pricing', 'Showcase'].map(item => (
                  <li key={item}><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2 space-y-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-white/20">Company</h4>
              <ul className="space-y-4">
                {['About Us', 'Careers', 'Privacy', 'Terms'].map(item => (
                  <li key={item}><a href="#" className="text-sm text-white/40 hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4 space-y-8">
              <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-white/20">Newsletter</h4>
              <p className="text-sm text-white/40 font-light">Get the latest AI synthesis tips and updates.</p>
              <form className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors" 
                />
                <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl text-sm font-bold transition-all">
                  Join
                </button>
              </form>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.4em]">
                Effangha Edem Technologies Co., Ltd
              </p>
              <p className="text-white/10 text-[10px] font-light">
                &copy; 2024 Effangha Edem Technologies Co., Ltd. All rights reserved.
              </p>
            </div>
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-white/20">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
