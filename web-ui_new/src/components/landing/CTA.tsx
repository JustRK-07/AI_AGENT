"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-24 px-4 md:px-8 lg:px-12 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[rgb(2,112,224)] rounded-3xl p-12 md:p-16 overflow-hidden shadow-2xl"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:3rem_3rem]" />

          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Ready to Transform Your
              <br />
              Voice Communication?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join hundreds of companies using our AI voice platform to automate calls and improve customer engagement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative flex-1 max-w-md w-full">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 rounded-lg bg-white border-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300 font-medium"
                />
              </div>
              <button className="group px-8 py-4 bg-white text-[rgb(2,112,224)] rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl whitespace-nowrap">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <p className="text-blue-100 text-sm mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
