'use client';

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface TicketFormProps {
  onSuccess?: (ticket: any) => void;
  onCancel?: () => void;
}

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface FormData {
  subject: string;
  description: string;
  priority: Priority;
}

interface FormErrors {
  subject?: string;
  description?: string;
  priority?: string;
  general?: string;
}

export default function TicketForm({ onSuccess, onCancel }: TicketFormProps) {
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    description: '',
    priority: 'MEDIUM',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'LOW', label: 'Low', color: 'text-gray-600' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    } else if (formData.subject.trim().length > 200) {
      newErrors.subject = 'Subject must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setErrors({ general: 'You must be logged in to create a ticket' });
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/support/tickets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject: formData.subject.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create ticket');
      }

      if (data.success) {
        setSubmitSuccess(true);
        setFormData({
          subject: '',
          description: '',
          priority: 'MEDIUM',
        });

        setTimeout(() => {
          setSubmitSuccess(false);
          if (onSuccess) {
            onSuccess(data.data);
          }
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to create ticket');
      }
    } catch (error: any) {
      console.error('Ticket creation error:', error);
      setErrors({
        general: error.message || 'Failed to create ticket. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | Priority
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ticket Created Successfully!
          </h3>
          <p className="text-gray-600">
            Your support ticket has been submitted. We&apos;ll get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Create Support Ticket
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Brief summary of your issue"
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              errors.subject
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
            }`}
            disabled={isSubmitting}
          />
          {errors.subject && (
            <p className="mt-1.5 text-sm text-red-600">{errors.subject}</p>
          )}
          <p className="mt-1.5 text-xs text-gray-500">
            {formData.subject.length}/200 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) =>
              handleInputChange('priority', e.target.value as Priority)
            }
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              errors.priority
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
            }`}
            disabled={isSubmitting}
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p className="mt-1.5 text-sm text-red-600">{errors.priority}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Provide detailed information about your issue..."
            rows={8}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none ${
              errors.description
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
            }`}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1.5 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1.5 text-xs text-gray-500">
            {formData.description.length}/5000 characters
          </p>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Ticket...
              </>
            ) : (
              'Create Ticket'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}