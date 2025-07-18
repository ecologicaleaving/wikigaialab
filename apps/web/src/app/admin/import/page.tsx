'use client';

import { BulkImportInterface } from '@/components/admin/BulkImportInterface';

export default function AdminImportPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Content Import</h1>
        <p className="mt-2 text-sm text-gray-700">
          Import multiple problems from CSV or JSON files to quickly populate the platform with quality content.
        </p>
      </div>

      <BulkImportInterface />
    </div>
  );
}