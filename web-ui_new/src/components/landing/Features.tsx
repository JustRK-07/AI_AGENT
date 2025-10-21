"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Users,
  Zap,
  Shield,
  BarChart3,
  Globe,
  PhoneCall,
  Bot,
  Clock,
} from "lucide-react";
import VoiceCallPopup from "./VoiceCallPopup";

interface DemoAgent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  displayOrder: number;
}

const features = [
  {
    icon: PhoneCall,
    title: "Outbound Campaigns",
    description: "Automate calls to thousands of leads with intelligent AI agents that qualify and engage prospects.",
  },
  {
    icon: Phone,
    title: "Inbound Call Handling",
    description: "Handle incoming calls 24/7 with AI agents that understand context and provide accurate responses.",
  },
  {
    icon: Users,
    title: "Multi-Agent Support",
    description: "Deploy multiple AI agents simultaneously to handle high call volumes efficiently.",
  },
  // {
  //   icon: Zap,
  //   title: "Real-time Analytics",
  //   description: "Track call metrics, success rates, and agent performance in real-time dashboards.",
  // },
  // {
  //   icon: Globe,
  //   title: "LiveKit Integration",
  //   description: "Built on LiveKit's enterprise-grade infrastructure for crystal-clear voice quality.",
  // },
  // {
  //   icon: Shield,
  //   title: "Twilio SIP Trunking",
  //   description: "Reliable call delivery through Twilio's global telecommunications network.",
  // },
  // {
  //   icon: BarChart3,
  //   title: "Campaign Management",
  //   description: "Create, monitor, and optimize campaigns with our intuitive dashboard.",
  // },
  // {
  //   icon: Bot,
  //   title: "AI-Powered",
  //   description: "Leverages GPT-4 and advanced NLP for natural, human-like conversations.",
  // },
  // {
  //   icon: Clock,
  //   title: "Low Latency",
  //   description: "Sub-500ms response times ensure smooth, natural conversation flow.",
  // },
];

export default function Features() {
  const [isCallPopupOpen, setIsCallPopupOpen] = useState(false);
  const [selectedDemoType, setSelectedDemoType] = useState<string>("restaurant");
  const [demoAgents, setDemoAgents] = useState<DemoAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemoAgents = async () => {
      try {
        setIsLoading(true);
        // Public endpoint - no authentication required
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/demo-agents`);

        if (!response.ok) {
          throw new Error('Failed to fetch demo agents');
        }

        const data = await response.json();
        setDemoAgents(data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching demo agents:', err);
        setError('Failed to load demo agents');
        // Fallback to empty array on error
        setDemoAgents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemoAgents();
  }, []);

  const handleTalkNow = (demoSlug: string) => {
    setSelectedDemoType(demoSlug);
    setIsCallPopupOpen(true);
  };

  return (
    <section id="features" className="py-32 px-4 md:px-8 lg:px-12 overflow-hidden bg-gray-50">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0270e008_1px,transparent_1px),linear-gradient(to_bottom,#0270e008_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Demo Cards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-32"
        >
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-6"
            >
              <Phone className="w-4 h-4 text-[rgb(2,112,224)]" />
              <span className="text-sm text-gray-700 font-medium">Interactive Demos</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[rgb(2,112,224)] to-blue-600 bg-clip-text text-transparent">Try Our AI Agents</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the power of voice AI with live demos. Click to start a conversation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading ? (
              // Loading skeleton
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-10 border-2 border-gray-200 animate-pulse">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-200 mb-6" />
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-8" />
                    <div className="h-12 bg-gray-200 rounded-full w-32" />
                  </div>
                </div>
              ))
            ) : error ? (
              // Error state
              <div className="col-span-3 text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-[rgb(2,112,224)] text-white rounded-lg hover:bg-[rgb(1,90,180)] transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : demoAgents.length === 0 ? (
              // Empty state
              <div className="col-span-3 text-center py-12 text-gray-600">
                No demo agents available at the moment.
              </div>
            ) : (
              // Loaded demo agents
              demoAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group"
                >
                  <button
                    onClick={() => handleTalkNow(agent.slug)}
                    className="w-full bg-white rounded-3xl p-10 border-2 border-gray-200 hover:border-[rgb(2,112,224)] transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-[rgb(2,112,224)] to-blue-600 flex items-center justify-center mb-6 group-hover:shadow-[0_0_40px_rgba(2,112,224,0.4)] transition-shadow"
                      >
                        <Phone className="w-10 h-10 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-3 text-gray-900">{agent.title}</h3>
                      <p className="text-gray-600 mb-8 leading-relaxed">{agent.description || ""}</p>
                      <div className="inline-flex items-center gap-2 px-8 py-4 bg-[rgb(2,112,224)] text-white rounded-full font-semibold transition-all duration-300 group-hover:bg-[rgb(1,90,180)] group-hover:shadow-lg group-hover:scale-105">
                        <Phone className="w-5 h-5" />
                        <span>Talk Now</span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-6"
          >
            <Zap className="w-4 h-4 text-[rgb(2,112,224)]" />
            <span className="text-sm text-gray-700 font-medium">Platform Capabilities</span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[rgb(2,112,224)] to-blue-600 bg-clip-text text-transparent">Powerful Features</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Build and scale enterprise-grade voice AI solutions with powerful features
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="group bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-[rgb(2,112,224)] hover:shadow-xl transition-all duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[rgb(2,112,224)] to-blue-600 flex items-center justify-center mb-6 group-hover:shadow-[0_0_30px_rgba(2,112,224,0.3)] transition-shadow"
              >
                <feature.icon className="w-7 h-7 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Voice Call Popup */}
        <VoiceCallPopup
          isOpen={isCallPopupOpen}
          onClose={() => setIsCallPopupOpen(false)}
          demoType={selectedDemoType}
        />
      </div>
    </section>
  );
}
