import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import {
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Mail,
  Globe,
  Linkedin,
  ArrowLeft,
  CheckCircle2,
  Users,
  Trophy,
  Target,
  Calendar,
  Star,
} from 'lucide-react';

interface Investor {
  id: number;
  firmName: string;
  investorType: string;
  fundSize: string;
  checkSizeMin: string;
  checkSizeMax: string;
  investmentStage: string[];
  industries: string[];
  geographies: string[];
  portfolio: any[];
  expertise: string[];
  bio: string;
  linkedinUrl: string;
  websiteUrl: string;
  isAcceptingPitches: boolean;
  responseTime: number;
  dealCount: number;
  verified: boolean;
}

export default function InvestorProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<{ investor: Investor }>({
    queryKey: ['/api/wizards/investors', id],
    queryFn: async () => {
      const res = await fetch(`/api/wizards/investors/${id}`);
      if (!res.ok) throw new Error('Failed to fetch investor');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-[hsl(0,0%,98%)] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 rounded-full bg-[hsl(222,47%,15%)] mx-auto mb-4"></div>
          <p className="text-[hsl(220,9%,65%)]">Loading investor profile...</p>
        </div>
      </div>
    );
  }

  if (!data?.investor) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-[hsl(0,0%,98%)] flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-[hsl(220,9%,65%)]" />
          <p className="text-[hsl(220,9%,65%)]">Investor not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setLocation('/investors')}
            data-testid="button-back-to-investors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Investors
          </Button>
        </div>
      </div>
    );
  }

  const investor = data.investor;

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-[hsl(0,0%,98%)]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation('/investors')}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Investors
        </Button>

        {/* Header Section */}
        <Card className="p-8 bg-[hsl(222,47%,15%)] border-white/10 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] flex items-center justify-center">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2" data-testid="text-investor-firm-name">
                    {investor.firmName || 'Angel Investor'}
                  </h1>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-[hsl(217,91%,60%)]/20 text-[hsl(217,91%,60%)] border-[hsl(217,91%,60%)]/30">
                      {(investor.investorType ?? 'angel').replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    {investor.verified && (
                      <Badge className="bg-[hsl(142,71%,45%)]/20 text-[hsl(142,71%,45%)] border-[hsl(142,71%,45%)]/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {investor.isAcceptingPitches && (
                      <Badge className="bg-[hsl(142,71%,45%)]/20 text-[hsl(142,71%,45%)] border-[hsl(142,71%,45%)]/30">
                        <Target className="w-3 h-3 mr-1" />
                        Accepting Pitches
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[hsl(220,9%,65%)] mb-6 leading-relaxed" data-testid="text-investor-bio">
                {investor.bio || 'No bio available'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                  <div>
                    <p className="text-xs text-[hsl(220,9%,65%)]">Check Size</p>
                    <p className="font-semibold" data-testid="text-check-size">
                      ${investor.checkSizeMin || '0'}K - ${investor.checkSizeMax || '0'}K
                    </p>
                  </div>
                </div>
                {investor.fundSize && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                    <div>
                      <p className="text-xs text-[hsl(220,9%,65%)]">Fund Size</p>
                      <p className="font-semibold" data-testid="text-fund-size">
                        ${investor.fundSize}M
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                  <div>
                    <p className="text-xs text-[hsl(220,9%,65%)]">Deals</p>
                    <p className="font-semibold" data-testid="text-deal-count">
                      {investor.dealCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {investor.websiteUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(investor.websiteUrl, '_blank')}
                    data-testid="button-website"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </Button>
                )}
                {investor.linkedinUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(investor.linkedinUrl, '_blank')}
                    data-testid="button-linkedin"
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Investment Focus */}
          <div className="lg:col-span-2 space-y-8">
            {/* Investment Stages */}
            <Card className="p-6 bg-[hsl(222,47%,15%)] border-white/10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                Investment Stages
              </h2>
              <div className="flex flex-wrap gap-2">
                {investor.investmentStage && investor.investmentStage.length > 0 ? (
                  investor.investmentStage.map((stage, idx) => (
                    <Badge
                      key={idx}
                      className="bg-[hsl(217,91%,60%)]/20 text-[hsl(217,91%,60%)] border-[hsl(217,91%,60%)]/30"
                      data-testid={`badge-stage-${idx}`}
                    >
                      {stage.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  ))
                ) : (
                  <p className="text-[hsl(220,9%,65%)] text-sm">No investment stages specified</p>
                )}
              </div>
            </Card>

            {/* Industries */}
            <Card className="p-6 bg-[hsl(222,47%,15%)] border-white/10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                Industry Focus
              </h2>
              <div className="flex flex-wrap gap-2">
                {investor.industries && investor.industries.length > 0 ? (
                  investor.industries.map((industry, idx) => (
                    <Badge
                      key={idx}
                      className="bg-[hsl(270,75%,65%)]/20 text-[hsl(270,75%,65%)] border-[hsl(270,75%,65%)]/30"
                      data-testid={`badge-industry-${idx}`}
                    >
                      {industry.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  ))
                ) : (
                  <p className="text-[hsl(220,9%,65%)] text-sm">No industries specified</p>
                )}
              </div>
            </Card>

            {/* Portfolio Companies */}
            <Card className="p-6 bg-[hsl(222,47%,15%)] border-white/10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                Portfolio Companies
              </h2>
              {investor.portfolio && investor.portfolio.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {investor.portfolio.map((company: any, idx: number) => (
                    <Card
                      key={idx}
                      className="p-4 bg-[hsl(222,47%,20%)] border-white/10"
                      data-testid={`card-portfolio-${idx}`}
                    >
                      <h3 className="font-semibold mb-1">{company.name || 'Unnamed Company'}</h3>
                      {company.description && (
                        <p className="text-sm text-[hsl(220,9%,65%)] line-clamp-2">{company.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-[hsl(220,9%,65%)] text-sm">No portfolio companies listed</p>
              )}
            </Card>

            {/* Expertise */}
            {investor.expertise && investor.expertise.length > 0 && (
              <Card className="p-6 bg-[hsl(222,47%,15%)] border-white/10">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                  Areas of Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {investor.expertise.map((exp, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      data-testid={`badge-expertise-${idx}`}
                    >
                      {exp}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-8">
            {/* Geographies */}
            <Card className="p-6 bg-[hsl(222,47%,15%)] border-white/10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                Geographies
              </h2>
              <div className="space-y-2">
                {investor.geographies && investor.geographies.length > 0 ? (
                  investor.geographies.map((geo, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="mr-2 mb-2"
                      data-testid={`badge-geo-${idx}`}
                    >
                      {geo.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  ))
                ) : (
                  <p className="text-[hsl(220,9%,65%)] text-sm">No geographies specified</p>
                )}
              </div>
            </Card>

            {/* Response Time */}
            {investor.responseTime && (
              <Card className="p-6 bg-[hsl(222,47%,15%)] border-white/10">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                  Response Time
                </h2>
                <p className="text-2xl font-bold text-[hsl(217,91%,60%)]" data-testid="text-response-time">
                  {investor.responseTime} days
                </p>
                <p className="text-sm text-[hsl(220,9%,65%)] mt-2">Average response time to pitches</p>
              </Card>
            )}

            {/* Contact CTA */}
            {investor.isAcceptingPitches && (
              <Card className="p-6 bg-gradient-to-br from-[hsl(217,91%,60%)]/10 to-[hsl(270,75%,65%)]/10 border-[hsl(217,91%,60%)]/30">
                <h2 className="text-xl font-semibold mb-4">Ready to Connect?</h2>
                <p className="text-sm text-[hsl(220,9%,65%)] mb-4">
                  This investor is currently accepting pitches. Send a connection request to get started.
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] hover:opacity-90"
                  onClick={() => setLocation('/investors')}
                  data-testid="button-request-connection"
                >
                  Request Connection
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
