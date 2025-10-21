"use client";

import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, Phone } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-3xl font-bold text-[rgb(2,112,224)]">ytel</span>
            </Link>
            <p className="text-gray-600 mb-6 max-w-md">
              Transform your business with AI-powered voice agents. Automate calls and handle inquiries 24/7 with enterprise-grade reliability.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-[rgb(2,112,224)] hover:text-white flex items-center justify-center transition-all text-gray-600"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-[rgb(2,112,224)] hover:text-white flex items-center justify-center transition-all text-gray-600"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-[rgb(2,112,224)] hover:text-white flex items-center justify-center transition-all text-gray-600"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Products</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Voice Platform
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  AI Agents
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  API Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
                  Partners
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-200 pt-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-5 h-5 text-[rgb(2,112,224)]" />
              <a href="mailto:contact@ytel.com" className="hover:text-[rgb(2,112,224)] transition-colors">
                contact@ytel.com
              </a>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-5 h-5 text-[rgb(2,112,224)]" />
              <a href="tel:+18005551234" className="hover:text-[rgb(2,112,224)] transition-colors">
                +1 (800) 555-1234
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-600">
            &copy; {currentYear} Ytel. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-gray-600 hover:text-[rgb(2,112,224)] transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
