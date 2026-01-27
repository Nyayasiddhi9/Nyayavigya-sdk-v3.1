import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { X, Search, HelpCircle, BookOpen, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  faqData,
  quickStartSteps,
  searchFAQs,
  getContextualHelp,
  getFAQsByIds,
  type FAQItem
} from '@shared/help-content';

interface HelpSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpSidebar({ isOpen, onClose }: HelpSidebarProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>(faqData);
  const [activeTab, setActiveTab] = useState<'contextual' | 'faq' | 'quickstart'>('contextual');

  const contextualHelp = getContextualHelp(location);

  useEffect(() => {
    const results = searchFAQs(searchQuery);
    setFilteredFAQs(results);
  }, [searchQuery]);

  if (!isOpen) return null;

  const categoryColors = {
    general: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    onboarding: 'bg-green-500/10 text-green-400 border-blue-500/20',
    studios: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    billing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    technical: 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[hsl(222,47%,11%)] dark:bg-[hsl(222,47%,11%)] border-l border-white/10 z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-white">Help Center</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/70 hover:text-white"
          data-testid="button-close-help"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('contextual')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'contextual'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-white/60 hover:text-white/80'
          }`}
          data-testid="button-tab-contextual"
        >
          <Lightbulb className="w-4 h-4 inline-block mr-1" />
          Contextual
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'faq'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-white/60 hover:text-white/80'
          }`}
          data-testid="button-tab-faq"
        >
          <HelpCircle className="w-4 h-4 inline-block mr-1" />
          FAQ
        </button>
        <button
          onClick={() => setActiveTab('quickstart')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'quickstart'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-white/60 hover:text-white/80'
          }`}
          data-testid="button-tab-quickstart"
        >
          <BookOpen className="w-4 h-4 inline-block mr-1" />
          Quick Start
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {/* Contextual Help Tab */}
        {activeTab === 'contextual' && (
          <div className="space-y-4" data-testid="content-contextual-help">
            {contextualHelp ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {contextualHelp.title}
                  </h3>
                  <p className="text-sm text-white/70 mb-4">
                    {contextualHelp.description}
                  </p>
                </div>

                {contextualHelp.tips.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Tips & Best Practices
                    </h4>
                    <ul className="space-y-2">
                      {contextualHelp.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-white/70 pl-4 border-l-2 border-primary/30">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {contextualHelp.relatedFAQs.length > 0 && (
                  <div>
                    <Separator className="my-4 bg-white/10" />
                    <h4 className="text-sm font-semibold text-white mb-3">Related FAQs</h4>
                    <Accordion type="single" collapsible className="space-y-2">
                      {getFAQsByIds(contextualHelp.relatedFAQs).map((faq) => (
                        <AccordionItem
                          key={faq.id}
                          value={faq.id}
                          className="border border-white/10 rounded-lg px-4 bg-white/5"
                        >
                          <AccordionTrigger className="text-sm text-white hover:text-primary py-3">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-white/70 pb-3">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-white/50">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No contextual help available for this page.</p>
                <p className="text-xs mt-2">Try the FAQ or Quick Start tabs.</p>
              </div>
            )}
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-4" data-testid="content-faq">
            <div className="sticky top-0 bg-[hsl(222,47%,11%)] pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-search-faq"
                />
              </div>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {filteredFAQs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="border border-white/10 rounded-lg px-4 bg-white/5"
                  data-testid={`faq-item-${faq.id}`}
                >
                  <AccordionTrigger className="text-sm text-white hover:text-primary py-3">
                    <div className="flex items-center gap-2 text-left">
                      <Badge className={`text-xs ${categoryColors[faq.category]}`}>
                        {faq.category}
                      </Badge>
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-white/70 pb-3">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-8 text-white/50">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No FAQs match your search.</p>
                <Button
                  variant="link"
                  onClick={() => setSearchQuery('')}
                  className="text-primary mt-2"
                  data-testid="button-clear-search"
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Quick Start Tab */}
        {activeTab === 'quickstart' && (
          <div className="space-y-4" data-testid="content-quickstart">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Quick Start Guide</h3>
              <p className="text-sm text-white/70 mb-4">
                Follow these steps to get started with Wizards Incubator and launch your first MVP.
              </p>
            </div>

            <div className="space-y-3">
              {quickStartSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg"
                  data-testid={`quickstart-step-${step.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {step.title}
                      </h4>
                      <p className="text-sm text-white/70 mb-3">
                        {step.description}
                      </p>
                      {step.actionLabel && step.actionLink && (
                        <a href={step.actionLink}>
                          <Button
                            size="sm"
                            className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                            data-testid={`button-quickstart-${step.id}`}
                          >
                            {step.actionLabel}
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
