import Head from "next/head";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import FAQ from "@/components/landing/FAQ";
import CTA from "@/components/landing/CTA";
import Navigation from "@/components/landing/Navigation";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>AI Voice Automation Platform | Ytel</title>
        <meta name="description" content="Transform your business with AI-powered voice agents. Automate calls, handle inquiries 24/7, and scale your voice communication with enterprise-grade reliability." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon-blue.png" />
        <link rel="shortcut icon" href="/favicon-blue.png" />
      </Head>
      <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
        {/* Fixed Navigation */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
        </div>

        {/* Main Content with top padding for fixed nav */}
        <Hero />
        <Features />
        <FAQ />
        <CTA />

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
