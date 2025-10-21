"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is an AI Voice Calling Platform?",
    answer:
      "Our platform combines LiveKit's real-time infrastructure with Twilio's telecommunications network to enable automated voice conversations powered by GPT-4. It can handle both outbound campaigns (calling leads) and inbound calls (answering customer inquiries) 24/7.",
  },
  {
    question: "How does outbound calling work?",
    answer:
      "Upload your lead list through our dashboard, configure your AI agent's behavior, and start the campaign. The system automatically calls leads, qualifies them based on your criteria, and logs detailed interaction data for follow-up.",
  },
  {
    question: "Can I customize the AI agent's voice and behavior?",
    answer:
      "Yes! You can customize the agent's instructions, tone, language, and even integrate custom workflows. The AI adapts its responses based on the conversation context while maintaining your brand voice.",
  },
  {
    question: "What call volumes can the system handle?",
    answer:
      "Our platform scales from small businesses to enterprise deployments. With multi-agent support, you can run hundreds of concurrent calls. The system automatically manages queue distribution and load balancing.",
  },
  {
    question: "Is the platform compatible with my existing phone system?",
    answer:
      "Yes, we use industry-standard SIP trunking via Twilio, which integrates with virtually any phone system. You can also use your existing Twilio numbers or get new ones through our platform.",
  },
  {
    question: "What languages are supported?",
    answer:
      "The platform supports 80+ languages with natural accent detection and synthesis. AI agents can automatically detect the caller's language and respond accordingly.",
  },
  {
    question: "How secure is my data?",
    answer:
      "We use enterprise-grade encryption for all voice data and follow SOC 2 Type II compliance standards. Call recordings and transcripts are stored securely with configurable retention policies.",
  },
  {
    question: "What kind of analytics do you provide?",
    answer:
      "Real-time dashboards show call duration, success rates, agent performance, lead qualification status, and sentiment analysis. Export data to your CRM or BI tools via our API.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-4 md:px-8 lg:px-12 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[rgb(2,112,224)] to-blue-600 bg-clip-text text-transparent">Frequently Asked Questions</span>
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about our platform
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-[rgb(2,112,224)] transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-lg font-semibold text-gray-900 pr-8">{faq.question}</span>
                <ChevronDown
                  className={`w-6 h-6 text-[rgb(2,112,224)] transition-transform flex-shrink-0 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-8 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
