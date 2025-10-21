/**
 * Agent Template Selector Component
 * Displays available agent templates and allows users to select one
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  PhoneForwarded,
  Calendar,
  Headphones,
  UserCheck,
  Package,
  Moon,
  Search,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { templateLibrary, getPriorityTemplates, type AgentTemplate } from '@/templates';

interface AgentTemplateSelectorProps {
  onSelect: (template: AgentTemplate) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ICON_MAP: Record<string, any> = {
  PhoneForwarded: PhoneForwarded,
  Calendar: Calendar,
  Headphones: Headphones,
  UserCheck: UserCheck,
  Package: Package,
  Moon: Moon,
};

export function AgentTemplateSelector({ onSelect, open, onOpenChange }: AgentTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const priorityTemplates = getPriorityTemplates();

  const filteredTemplates = templateLibrary.templates.filter((template) => {
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = (template: AgentTemplate) => {
    onSelect(template);
    if (onOpenChange) onOpenChange(false);
  };

  const TemplateCard = ({ template, isPriority }: { template: AgentTemplate; isPriority?: boolean }) => {
    const Icon = ICON_MAP[template.icon] || Sparkles;

    return (
      <div
        className={`
          relative p-4 border rounded-xl hover:shadow-lg transition-all cursor-pointer group
          ${isPriority ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300'}
        `}
        onClick={() => handleSelectTemplate(template)}
      >
        {isPriority && (
          <div className="absolute -top-2 -right-2">
            <Badge className="bg-blue-600 text-white shadow-lg">
              <Sparkles className="h-3 w-3 mr-1" />
              Priority
            </Badge>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className={`
            p-2 rounded-lg
            ${isPriority ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 group-hover:bg-blue-100'}
          `}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {template.features.slice(0, 3).map((feature, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded"
                >
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {feature}
                </span>
              ))}
              {template.features.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-0.5">
                  +{template.features.length - 3} more
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {template.category}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs group-hover:bg-blue-600 group-hover:text-white"
              >
                Use Template
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-2 border-dashed border-blue-300 hover:border-blue-500">
          <Sparkles className="h-4 w-4 mr-2" />
          Start from Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Choose an Agent Template
          </DialogTitle>
          <DialogDescription>
            Start with a pre-configured template optimized for common inbound use cases.
            You can customize everything after selection.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="px-3 py-2 border rounded-lg text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {templateLibrary.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Templates */}
        {selectedCategory === 'all' && searchQuery === '' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-sm">Recommended for You</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {priorityTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} isPriority />
              ))}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div>
          <h3 className="font-semibold text-sm mb-3">
            {selectedCategory === 'all' ? 'All Templates' : selectedCategory}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No templates found matching your search.</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> After selecting a template, you can customize all fields including
            business hours, transfer numbers, fallback options, and system prompts to match your specific needs.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
