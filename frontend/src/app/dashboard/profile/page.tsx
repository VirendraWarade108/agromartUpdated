'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Save, X, Plus } from 'lucide-react';
import useAuth from '@/hooks/useAuth';
import { userApi, handleApiError } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/store/uiStore';
import { PageLoader, SectionLoader } from '@/components/shared/LoadingSpinner';
import AuthGuard from '@/components/shared/AuthGuard';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

function ProfileContent() {
  const router = useRouter();
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await userApi.getAddresses();
      if (response.data.success) {
        setAddresses(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await updateProfile(formData);
      if (success) {
        setIsEditing(false);
        showSuccessToast('Profile updated successfully');
      } else {
        showErrorToast('Failed to update profile');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Update Failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress) return;

    setIsLoading(true);
    try {
      const response = await userApi.addAddress(editingAddress);
      if (response.data.success) {
        await fetchAddresses();
        setEditingAddress(null);
        setShowAddressForm(false);
        showSuccessToast('Address added successfully');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to add address');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle set default address
  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await userApi.setDefaultAddress(addressId);
      if (response.data.success) {
        await fetchAddresses();
        showSuccessToast('Default address updated');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to update');
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Delete this address?')) return;

    try {
      const response = await userApi.deleteAddress(addressId);
      if (response.data.success) {
        await fetchAddresses();
        showSuccessToast('Address deleted');
      }
    } catch (error) {
      const message = handleApiError(error);
      showErrorToast(message, 'Failed to delete');
    }
  };

  if (authLoading) {
    return <PageLoader message="Loading profile..." />;
  }

  if (!user) {
    return <PageLoader message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <User className="w-8 h-8 text-green-400" />
            My Profile
          </h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm flex items-center gap-2"
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Full Name</p>
                    <p className="text-lg font-bold text-gray-900">{user.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Email</p>
                    <p className="text-lg font-bold text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Phone</p>
                    <p className="text-lg font-bold text-gray-900">{user.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Addresses Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-green-600" />
              Saved Addresses
            </h2>
            <button
              onClick={() => {
                setEditingAddress({
                  id: '',
                  label: '',
                  street: '',
                  city: '',
                  state: '',
                  postalCode: '',
                  country: 'India',
                  isDefault: false,
                });
                setShowAddressForm(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Address
            </button>
          </div>

          {showAddressForm && editingAddress && (
            <form onSubmit={handleAddAddress} className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Address Label (e.g., Home, Office)"
                  value={editingAddress.label}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, label: e.target.value })
                  }
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  value={editingAddress.street}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, street: e.target.value })
                  }
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={editingAddress.city}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, city: e.target.value })
                  }
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={editingAddress.state}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, state: e.target.value })
                  }
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Postal Code"
                  value={editingAddress.postalCode}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, postalCode: e.target.value })
                  }
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {addresses.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    address.isDefault
                      ? 'bg-green-50 border-green-400'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{address.label}</h3>
                    {address.isDefault && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {address.street}, {address.city}, {address.state} {address.postalCode}
                  </p>
                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-semibold">No addresses saved</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard requireAuth={true}>
      <ProfileContent />
    </AuthGuard>
  );
}
