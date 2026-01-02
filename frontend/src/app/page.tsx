'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Bot, FileText, Globe, Code, Zap, Shield, ArrowRight, CheckCircle2, Sparkles, Cpu, BarChart } from 'lucide-react';

export default function Home() {
  const isProd = process.env.NODE_ENV === "production";
  console.log("IS PROD page:", isProd);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link className="flex items-center gap-2 group" href="#">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 group-hover:scale-105 transition-transform">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">MyChat</span>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link className="text-sm font-medium text-gray-400 hover:text-white transition-colors" href="#features">Features</Link>
            <Link className="text-sm font-medium text-gray-400 hover:text-white transition-colors" href="#how-it-works">How it Works</Link>
            <Link className="text-sm font-medium text-gray-400 hover:text-white transition-colors" href="#pricing">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block" href="/login">
              Sign In
            </Link>
            <Link href="/signup">
              <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 pt-32">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-400 mb-8"
          >
            <Sparkles className="h-4 w-4" />
            <span>From Data To Chatbot in 2-Minutes</span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Build AI Chatbots that <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Actually Know Your Business
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Connect your own models via OpenRouter, customize your widget's look and feel, and enforce strict safety rules.
            The most powerful localized chat solution.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0">
                Start Building Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Powerful features to help you build, train, and deploy your AI assistant without writing a single line of code.
            </p>
          </div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: FileText,
                title: 'Universal Data Ingestion',
                desc: 'Upload PDF, DOCX, HTML, TXT, or Markdown. We process and chunk everything for perfect retrieval.',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
              {
                icon: Globe,
                title: 'Smart Web Crawling',
                desc: 'Deep recursive crawling ensures your bot knows every corner of your documentation and website.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
              },
              {
                icon: Code,
                title: 'Brand-Perfect Widget',
                desc: 'Fully customizable placement, colors, welcome messages, and launcher styles to match your brand.',
                color: 'text-pink-400',
                bg: 'bg-pink-500/10',
              },
              {
                icon: Cpu,
                title: 'Bring Your Own Model',
                desc: 'Connect via OpenRouter to use GPT-4, Claude 3, Llama 3, or any model you prefer.',
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
              },
              {
                icon: Shield,
                title: 'Safety & Control',
                desc: 'Define strict safety prompts, allowed domains, and content boundaries. Your AI, your rules.',
                color: 'text-green-400',
                bg: 'bg-green-500/10',
              },
              {
                icon: BarChart,
                title: 'Analytics & Insights',
                desc: 'Track chat volume, user queries, and engagement stats to optimize your support.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group"
              >
                <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-4 py-24 border-t border-white/10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Start for free, upgrade when you need more power.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Self-hosted Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl border border-white/10 bg-white/5 relative overflow-hidden"
            >
              <h3 className="text-2xl font-bold mb-2">Self-hosted</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">Free</span>
                <span className="text-gray-400">/ Open Source</span>
              </div>
              <p className="text-gray-400 mb-8">Host it yourself on your own infrastructure.</p>
              <ul className="space-y-4 mb-8">
                {[
                  'Full Source Code Access',
                  'Deploy Anywhere (Docker)',
                  'Community Support',
                  'MIT License',
                  'Your Own AI Model'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="https://github.com/AppGambitStudio/mychat" target="_blank">
                <Button className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold">
                  View on GitHub
                </Button>
              </Link>
            </motion.div>

            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl border border-blue-500/30 bg-blue-500/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20">
                  Cloud
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-gray-400 mb-8">Perfect for testing and small projects.</p>
              <ul className="space-y-4 mb-8">
                {[
                  'Hosted by Us',
                  '1 Chat Space',
                  '10 Website Links (Recursive Scraping)',
                  '2 PDF Documents',
                  '5 MB Data Processing Limit',
                  'Unlimited Chats',
                  'Standard Support',
                  'Chat Widget Customization',
                  'Domain Whitelisting',
                  'Analytics & Insights',
                  'Bring Your Own Model',
                  'Safety & Control',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button className="w-full h-12 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold">
                  Get Started Free
                </Button>
              </Link>
            </motion.div>

            {/* Private Hosting Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500 text-white shadow-lg shadow-purple-500/20">
                  Enterprise
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Private Hosting</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold">Contact Us</span>
              </div>
              <p className="text-gray-400 mb-8">Dedicated infrastructure and custom limits.</p>
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited Chat Spaces',
                  'Unlimited Data Processing',
                  'Custom Domain & Branding',
                  'Dedicated Support',
                  'SLA & Uptime Guarantee',
                  'On-Premise Option'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="mailto:dhaval@appgambit.com">
                <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold">
                  Contact Sales
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900 to-purple-900 px-6 py-16 md:px-16 md:py-24 text-center">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to upgrade your support?</h2>
              <p className="text-blue-100 text-lg mb-10">
                Join thousands of developers and businesses building the future of customer interaction.
              </p>
              <Link href="/signup">
                <Button size="lg" className="h-14 px-8 rounded-full bg-white text-blue-900 hover:bg-gray-100 font-semibold text-lg">
                  Get Started Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-white/10">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">MyChat</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} <a href="https://appgambit.com" target="_blank" rel="noopener noreferrer">APPGAMBiT</a> MyChat. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">Twitter</Link>
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">GitHub</Link>
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">Discord</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
