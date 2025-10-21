import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileCode, Download, Copy, Check, Sun, Moon, X } from "lucide-react";
import type { Agent } from "@/services/agentsService";
import { generatePythonScript, getScriptFilename } from "@/utils/pythonScriptGenerator";

interface AgentScriptPreviewProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  model?: string;
  voice?: string;
  temperature?: number;
}

export function AgentScriptPreview({ agent, isOpen, onClose, model, voice, temperature }: AgentScriptPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [script, setScript] = useState("");
  const [filename, setFilename] = useState("");

  useEffect(() => {
    if (isOpen && agent) {
      // Generate voice agent Python script
      const generatedScript = generatePythonScript(agent, {
        model: model || 'gpt-4o-mini',
        voice: voice || agent.voiceId || 'alloy',
        temperature: temperature || 0.7,
      });

      setScript(generatedScript);
      setFilename(getScriptFilename(agent));
    }
  }, [isOpen, agent, model, voice, temperature]);

  const handleCopyScript = async () => {
    if (script) {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadScript = () => {
    if (script && filename) {
      const blob = new Blob([script], { type: 'text/x-python' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Split script into lines for better rendering
  const scriptLines = script.split('\n');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex-none px-6 py-4 border-b bg-white">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-blue-600" />
              <span>Python Voice Agent Script Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <span className="bg-gray-100 px-3 py-1 rounded font-mono text-xs">
                {filename}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-xs mt-2">
            <span><strong>Agent:</strong> {agent.name}</span>
            <span className="text-gray-400">|</span>
            <span><strong>Model:</strong> {model || 'gpt-4o-mini'}</span>
            <span className="text-gray-400">|</span>
            <span><strong>Voice:</strong> {voice || agent.voiceId || 'alloy'}</span>
            <span className="text-gray-400">|</span>
            <span><strong>Temperature:</strong> {temperature || 0.7}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-[450px]">
          {script ? (
            <div className={`flex ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
              {/* Line numbers column */}
              <div className={`w-16 flex-shrink-0 select-none ${
                isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
              }`}>
                <div className="py-4 px-3">
                  {scriptLines.map((_, index) => (
                    <div key={index} className="text-xs font-mono text-right leading-6">
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Code content */}
              <div className="flex-1 overflow-x-auto">
                <div className="py-4 px-4">
                  {scriptLines.map((line, index) => (
                    <div
                      key={index}
                      className={`text-xs font-mono leading-6 ${
                        isDarkMode
                          ? 'text-gray-100 hover:bg-gray-800/40'
                          : 'text-gray-900 hover:bg-gray-100'
                      }`}
                      style={{ whiteSpace: 'pre' }}
                    >
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No script available</p>
            </div>
          )}
        </div>

        <div className="flex-none flex justify-between items-center px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyScript}
              disabled={!script}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Script
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadScript}
              disabled={!script}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Python File
            </Button>
          </div>
          <Button variant="default" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
