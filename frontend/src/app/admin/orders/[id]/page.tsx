'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailPage() {
  const [order] = useState({
    id: '1',
    orderNumber: 'ORD-2024-001',
    customer: 'John Doe',
    status: 'Delivered',
    total: 1299,
    date: '2024-12-10',
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/orders" className="flex items-center gap-2 text-green-600 hover:text-green-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Order {order.orderNumber}</h1>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Customer</h3>
              <p className="text-lg text-gray-900">{order.customer}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Status</h3>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-lg font-semibold">{order.status}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Order Date</h3>
              <p className="text-lg text-gray-900">{order.date}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total</h3>
              <p className="text-lg text-gray-900">₹{order.total}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <p className="text-gray-600">No items to display</p>
          </div>
        </div>
      </div>
    </div>
  );
}
