import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="mb-4 flex items-center text-xs text-slate-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="mx-1.5 h-3.5 w-3.5 text-slate-400" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-slate-900 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-900">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
