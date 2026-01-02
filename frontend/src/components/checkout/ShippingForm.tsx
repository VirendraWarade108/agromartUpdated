import React, { useState } from 'react';
import { MapPin, User, Mail, Phone, Home, CheckCircle } from 'lucide-react';
import { Address } from '@/types';

export interface ShippingFormProps {
  initialData?: Partial<Address>;
  savedAddresses?: Address[];
  onSubmit: (data: Address) => void;
  onSelectSavedAddress?: (address: Address) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * ShippingForm Component
 * Handles shipping address collection with validation
 */
export default function ShippingForm({
  initialData,
  savedAddresses = [],
  onSubmit,
  onSelectSavedAddress,
  isLoading = false,
  className = '',
}: ShippingFormProps) {
  const [formData, setFormData] = useState<Partial<Address>>({
    type: 'home',
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    addressLine1: initialData?.addressLine1 || '',
    addressLine2: initialData?.addressLine2 || '',
    landmark: initialData?.landmark || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
    country: initialData?.country || 'India',
    isDefault: initialData?.isDefault || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSavedAddresses, setShowSavedAddresses] = useState(savedAddresses.length > 0);

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.addressLine1?.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state?.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode?.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData as Address);
  };

  /**
   * Handle saved address selection
   */
  const handleSelectAddress = (address: Address) => {
    setFormData(address);
    setShowSavedAddresses(false);
    
    if (onSelectSavedAddress) {
      onSelectSavedAddress(address);
    }
  };

  /**
   * Indian states list
   */
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  ];

  return (
    <div className={`bg-white rounded-2xl border-2 border-gray-200 shadow-xl ${className}`}>
      {/* Header */}
      <div className="p-6 border-b-2 border-gray-200">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <MapPin className="w-7 h-7 text-green-600" />
          Shipping Address
        </h2>
        <p className="text-gray-600 font-semibold mt-2">
          Enter the address where you want your order delivered
        </p>
      </div>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && showSavedAddresses && (
        <div className="p-6 border-b-2 border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Saved Addresses</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {savedAddresses.map((address) => (
              <button
                key={address.id}
                onClick={() => handleSelectAddress(address)}
                className="text-left p-4 bg-white border-2 border-gray-200 hover:border-green-400 rounded-xl transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{address.type}</span>
                    {address.isDefault && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="font-semibold text-gray-900 mb-1">{address.name}</p>
                <p className="text-sm text-gray-600 font-medium">
                  {address.addressLine1}, {address.city}
                  <br />
                  {address.state} - {address.pincode}
                </p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSavedAddresses(false)}
            className="mt-4 text-green-600 hover:text-green-700 font-bold text-sm transition-colors"
          >
            + Add New Address
          </button>
        </div>
      )}

      {/* Address Form */}
      {(!showSavedAddresses || savedAddresses.length === 0) && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Address Type */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Address Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'home', label: 'Home', icon: '🏠' },
                { value: 'office', label: 'Office', icon: '🏢' },
                { value: 'other', label: 'Other', icon: '📍' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: type.value as any }))}
                  className={`p-3 rounded-xl border-2 font-bold transition-all ${
                    formData.type === type.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mb-1 block">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-red-600 text-sm font-semibold mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                  errors.phone ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-600 text-sm font-semibold mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Address *
            </label>
            <div className="relative">
              <Home className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="House no., Street name, Area"
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                  errors.addressLine1
                    ? 'border-red-500'
                    : 'border-gray-200 focus:border-green-400'
                }`}
              />
            </div>
            {errors.addressLine1 && (
              <p className="text-red-600 text-sm font-semibold mt-1">{errors.addressLine1}</p>
            )}
          </div>

          {/* Address Line 2 (Optional) */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
              placeholder="Apartment, suite, building (optional)"
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
            />
          </div>

          {/* Landmark (Optional) */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Landmark (Optional)
            </label>
            <input
              type="text"
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              placeholder="Near famous location"
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 font-semibold text-gray-900 transition-all"
            />
          </div>

          {/* City, State, Pincode */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* City */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                  errors.city ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                }`}
              />
              {errors.city && (
                <p className="text-red-600 text-sm font-semibold mt-1">{errors.city}</p>
              )}
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                State *
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all appearance-none cursor-pointer ${
                  errors.state ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                }`}
              >
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-red-600 text-sm font-semibold mt-1">{errors.state}</p>
              )}
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Pincode *
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="110001"
                maxLength={6}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none font-semibold text-gray-900 transition-all ${
                  errors.pincode ? 'border-red-500' : 'border-gray-200 focus:border-green-400'
                }`}
              />
              {errors.pincode && (
                <p className="text-red-600 text-sm font-semibold mt-1">{errors.pincode}</p>
              )}
            </div>
          </div>

          {/* Save as Default */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="w-5 h-5 text-green-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-green-500 cursor-pointer"
            />
            <label className="font-bold text-gray-900 cursor-pointer select-none">
              Save as default address
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-black text-lg rounded-2xl shadow-2xl hover:scale-105 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                Continue to Payment
                <CheckCircle className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Back to Saved Addresses */}
          {savedAddresses.length > 0 && !showSavedAddresses && (
            <button
              type="button"
              onClick={() => setShowSavedAddresses(true)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all"
            >
              Use Saved Address
            </button>
          )}
        </form>
      )}
    </div>
  );
}