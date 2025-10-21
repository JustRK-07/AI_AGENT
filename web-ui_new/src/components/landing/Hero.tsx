"use client";

import { motion } from "framer-motion";
import { Phone, Mic, Zap, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center overflow-hidden px-4 md:px-8 lg:px-12 pt-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0270e010_1px,transparent_1px),linear-gradient(to_bottom,#0270e010_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(2,112,224,0.08),transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200"
          >
            {/* <Zap className="w-4 h-4 text-[rgb(2,112,224)]" /> */}
            <span className="text-sm text-gray-700 font-medium">
              {/* AI-Powered Voice Calling Platform */}
            </span>
          </motion.div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="block text-gray-900 mb-4">
              Transform Your
            </span>
            <span className="block bg-gradient-to-r from-[rgb(2,112,224)] to-blue-600 bg-clip-text text-transparent">
              Voice Communication
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Automate outbound campaigns and handle inbound calls with intelligent AI agents.
            {/* Built on LiveKit and Twilio for enterprise-grade reliability. */}
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <button className="group px-8 py-4 bg-[rgb(2,112,224)] text-white rounded-lg font-semibold text-lg hover:bg-[rgb(1,90,180)] transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl">
              <Phone className="w-5 h-5" />
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-lg hover:border-[rgb(2,112,224)] hover:text-[rgb(2,112,224)] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg">
              <Mic className="w-5 h-5" />
              Watch Demo
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-5xl mx-auto"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[rgb(2,112,224)] transition-all duration-300 shadow-md hover:shadow-xl"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-[rgb(2,112,224)] to-blue-600 bg-clip-text text-transparent mb-3">99.9%</div>
              <div className="text-gray-900 font-semibold text-lg">Uptime SLA</div>
              <div className="text-gray-600 text-sm mt-1">Enterprise reliability</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[rgb(2,112,224)] transition-all duration-300 shadow-md hover:shadow-xl"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-[rgb(2,112,224)] to-blue-600 bg-clip-text text-transparent mb-3">&lt;500ms</div>
              <div className="text-gray-900 font-semibold text-lg">Response Time</div>
              <div className="text-gray-600 text-sm mt-1">Lightning fast AI</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[rgb(2,112,224)] transition-all duration-300 shadow-md hover:shadow-xl"
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-[rgb(2,112,224)] to-blue-600 bg-clip-text text-transparent mb-3">80+</div>
              <div className="text-gray-900 font-semibold text-lg">Languages</div>
              <div className="text-gray-600 text-sm mt-1">Global reach</div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-gray-600 rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
}
