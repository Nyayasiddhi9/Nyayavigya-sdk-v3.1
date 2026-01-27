/**
 * UI Types for WAI Enterprise Platform
 */

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  sorting?: {
    key: keyof T;
    direction: 'asc' | 'desc';
    onSort: (key: keyof T, direction: 'asc' | 'desc') => void;
  };
  filtering?: {
    filters: Record<string, any>;
    onFilter: (filters: Record<string, any>) => void;
  };
  selection?: {
    selectedItems: T[];
    onSelectionChange: (items: T[]) => void;
    selectAll?: boolean;
  };
  actions?: {
    label: string;
    action: (item: T) => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }[];
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon?: React.ReactNode;
  loading?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export interface ChartProps {
  data: any[];
  width?: number;
  height?: number;
  loading?: boolean;
  legend?: boolean;
  tooltip?: boolean;
  responsive?: boolean;
}

export interface StatusBadgeProps {
  status: 'healthy' | 'degraded' | 'offline' | 'error' | 'active' | 'inactive' | 'pending' | 'success' | 'warning';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'outline';
}

export interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  showFilters?: boolean;
  filters?: FilterOption[];
  onFilterChange?: (filters: Record<string, any>) => void;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multi-select' | 'date' | 'number';
  options?: { label: string; value: any }[];
  placeholder?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  children?: NavigationItem[];
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

export interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export interface LoadingState {
  loading: boolean;
  error?: string | null;
  data?: any;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
}