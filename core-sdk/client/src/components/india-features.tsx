import { Languages, MessageCircle, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IndiaFeaturesProps {
  indiaFeatures: Record<string, any[]>;
}

export default function IndiaFeatures({ indiaFeatures }: IndiaFeaturesProps) {
  const languages = indiaFeatures.language || [];
  const whatsappFeatures = indiaFeatures.whatsapp || [];
  const upiFeatures = indiaFeatures.upi || [];

  return (
    <div 
      className="bg-gradient-to-r from-orange-500/10 via-white/5 to-green-500/10 border border-orange-500/20 rounded-lg p-6"
      data-testid="india-features"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="w-8 h-4 india-flag-colors rounded-sm"></span>
          <h3 className="text-lg font-semibold text-foreground">India-First Capabilities</h3>
        </div>
        <Badge className="bg-green-500/20 text-green-400">Production Ready</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Language Support */}
        <div className="bg-card/50 rounded-lg p-4" data-testid="language-support">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-500/10 rounded-md flex items-center justify-center">
              <Languages className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">12 Indic Languages</h4>
              <p className="text-xs text-muted-foreground">NLP, ASR, TTS Support</p>
            </div>
          </div>
          <div className="space-y-2">
            {languages.slice(0, 3).map((lang, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {lang.name} ({lang.config?.speakers || "N/A"})
                </span>
                <Badge 
                  variant={lang.config?.ttsQuality === "premium" ? "default" : "secondary"}
                  className={lang.config?.ttsQuality === "premium" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}
                >
                  {lang.config?.ttsQuality === "premium" ? "Premium TTS" : "Standard"}
                </Badge>
              </div>
            ))}
            {languages.length > 3 && (
              <div className="text-center pt-2">
                <span className="text-xs text-muted-foreground">+{languages.length - 3} more languages supported</span>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Business */}
        <div className="bg-card/50 rounded-lg p-4" data-testid="whatsapp-business">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-md flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">WhatsApp Business</h4>
              <p className="text-xs text-muted-foreground">API Integration</p>
            </div>
          </div>
          <div className="space-y-3">
            {whatsappFeatures.length > 0 && whatsappFeatures[0].config && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Message Rate</span>
                  <span className="text-sm font-medium text-foreground">
                    {whatsappFeatures[0].config.messageRate || "50/sec"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily Limit</span>
                  <span className="text-sm font-medium text-foreground">
                    {whatsappFeatures[0].config.dailyLimit || "100K"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Templates</span>
                  <span className="text-sm font-medium text-green-400">
                    {whatsappFeatures[0].config.templatesActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* UPI Integration */}
        <div className="bg-card/50 rounded-lg p-4" data-testid="upi-integration">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-md flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">UPI Payments</h4>
              <p className="text-xs text-muted-foreground">Gateway Integration</p>
            </div>
          </div>
          <div className="space-y-3">
            {upiFeatures.length > 0 && upiFeatures[0].config && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Max Transaction</span>
                  <span className="text-sm font-medium text-foreground">
                    {upiFeatures[0].config.maxTransaction || "₹2L"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Banks</span>
                  <span className="text-sm font-medium text-foreground">
                    {upiFeatures[0].config.supportedBanks || 30}+
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-sm font-medium text-green-400">
                    {upiFeatures[0].config.successRate || "98.5%"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
