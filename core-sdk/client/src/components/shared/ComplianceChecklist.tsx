import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Shield, FileText, Users } from 'lucide-react';

interface ComplianceItem {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'not_applicable';
  category: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI_DSS' | 'ISO27001' | 'SOC2';
  lastChecked: string;
  nextReview: string;
  documentation?: string;
  remediation?: string;
}

interface ComplianceChecklistProps {
  items: ComplianceItem[];
  title?: string;
  showActions?: boolean;
  onViewDetails?: (item: ComplianceItem) => void;
  onTakeAction?: (item: ComplianceItem) => void;
}

export default function ComplianceChecklist({ 
  items, 
  title = 'Compliance Status',
  showActions = true,
  onViewDetails,
  onTakeAction
}: ComplianceChecklistProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'non_compliant': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'not_applicable': return <Shield className="h-4 w-4 text-gray-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'non_compliant': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'not_applicable': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'GDPR': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'HIPAA': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'SOX': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PCI_DSS': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'ISO27001': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'SOC2': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const complianceStats = {
    total: items.length,
    compliant: items.filter(item => item.status === 'compliant').length,
    nonCompliant: items.filter(item => item.status === 'non_compliant').length,
    pending: items.filter(item => item.status === 'pending').length
  };

  const overallScore = complianceStats.total > 0 ? 
    Math.round((complianceStats.compliant / complianceStats.total) * 100) : 0;

  return (
    <Card data-testid="card-compliance-checklist">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle data-testid="compliance-title">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={overallScore >= 90 ? 'default' : overallScore >= 70 ? 'secondary' : 'destructive'}
              data-testid="compliance-score-badge"
            >
              {overallScore}% Compliant
            </Badge>
          </div>
        </div>
        
        {/* Compliance Summary */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600" data-testid="stat-compliant">
              {complianceStats.compliant}
            </div>
            <div className="text-xs text-gray-500">Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600" data-testid="stat-non-compliant">
              {complianceStats.nonCompliant}
            </div>
            <div className="text-xs text-gray-500">Non-Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending">
              {complianceStats.pending}
            </div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600" data-testid="stat-total">
              {complianceStats.total}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-4 rounded-lg border bg-gray-50 dark:bg-gray-800"
              data-testid={`compliance-item-${item.id}`}
            >
              <div className="flex-shrink-0 mt-1" data-testid={`compliance-status-icon-${item.id}`}>
                {getStatusIcon(item.status)}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100" data-testid={`compliance-name-${item.id}`}>
                        {item.name}
                      </h4>
                      <Badge className={`${getCategoryColor(item.category)} text-xs`} data-testid={`compliance-category-${item.id}`}>
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`compliance-description-${item.id}`}>
                      {item.description}
                    </p>
                  </div>
                  
                  <Badge className={`${getStatusColor(item.status)} text-xs`} data-testid={`compliance-status-badge-${item.id}`}>
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span data-testid={`compliance-last-checked-${item.id}`}>
                      Last checked: {item.lastChecked}
                    </span>
                    <span data-testid={`compliance-next-review-${item.id}`}>
                      Next review: {item.nextReview}
                    </span>
                  </div>
                  
                  {showActions && (
                    <div className="flex items-center gap-2">
                      {item.documentation && onViewDetails && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(item)}
                          className="text-xs"
                          data-testid={`button-view-details-${item.id}`}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      )}
                      {(item.status === 'non_compliant' || item.status === 'pending') && onTakeAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onTakeAction(item)}
                          className="text-xs"
                          data-testid={`button-take-action-${item.id}`}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Action
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                {item.remediation && item.status === 'non_compliant' && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs" data-testid={`compliance-remediation-${item.id}`}>
                    <strong>Remediation:</strong> {item.remediation}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}