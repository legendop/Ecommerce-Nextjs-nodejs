'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addressesApi, ordersApi, cartApi, deliveryApi, paymentsApi } from '@/lib/api';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatPrice } from '@/lib/utils';
import { Address, DeliveryCalculation } from '@/types';
import { MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { items, subtotal, itemsForValidation, clearCart } = useCart();
  const { config: siteConfig, initialize } = useSettingsStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [delivery, setDelivery] = useState<DeliveryCalculation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('COD');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initialize();
    if (!isAuthenticated) {
      router.push('/auth/login?returnUrl=/checkout');
      return;
    }
    if (items.length === 0) {
      router.push('/cart');
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, items, router, initialize]);

  const fetchAddresses = async () => {
    try {
      const response = await addressesApi.list();
      setAddresses(response.data.data || []);
      if (response.data.data?.length > 0) {
        const defaultAddr = response.data.data.find((a: Address) => a.isDefault);
        setSelectedAddress((defaultAddr?.id || response.data.data[0].id).toString());
      }
    } catch {
      toast.error('Failed to fetch addresses');
    }
  };

  useEffect(() => {
    if (selectedAddress) {
      const address = addresses.find((a) => a.id.toString() === selectedAddress);
      if (address?.latitude && address?.longitude) {
        checkDelivery(address.latitude, address.longitude);
      }
    }
  }, [selectedAddress, addresses]);

  const checkDelivery = async (lat: number, lng: number) => {
    try {
      // For now, use a default pincode based on lat/lng
      // In production, you'd geocode to get the actual pincode
      const response = await deliveryApi.check('700001');
      setDelivery(response.data.data);
    } catch {
      toast.error('Failed to check delivery');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    setIsLoading(true);
    try {
      const validationRes = await cartApi.validate(itemsForValidation);
      if (!validationRes.data.data.valid) {
        toast.error('Some items in your cart are no longer available');
        return;
      }

      const orderRes = await ordersApi.create({
        addressId: selectedAddress,
        items: itemsForValidation,
        paymentMethod,
      });
      const order = orderRes.data.data;

      if (paymentMethod === 'RAZORPAY') {
        const paymentRes = await paymentsApi.createRazorpayOrder(order.id);
        const { orderId, amount, currency, keyId } = paymentRes.data.data;
        const options = {
          key: keyId,
          amount,
          currency,
          name: siteConfig.name,
          description: `Order ${order.orderNumber}`,
          order_id: orderId,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await paymentsApi.verifyRazorpay(response);
              clearCart();
              router.push(`/order-success?order=${order.orderNumber}`);
            } catch {
              toast.error('Payment verification failed');
            }
          },
          theme: { color: siteConfig.theme?.primary || '#ec93c9' },
        };
        const razorpay = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay(options);
        razorpay.open();
      } else {
        clearCart();
        router.push(`/order-success?order=${order.orderNumber}`);
      }
    } catch {
      toast.error('Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  const total = subtotal + (delivery?.deliveryCharge || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-brand-purple mb-8">Checkout</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-purple">Delivery Address</h2>
              <button
                onClick={() => router.push('/account/addresses')}
                className="text-sm text-brand-pink hover:underline flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" /> Add New
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPinIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">No addresses found</p>
                <Button variant="pink" onClick={() => router.push('/account/addresses')}>
                  Add Address
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex items-start p-4 border-2 rounded-2xl cursor-pointer transition-colors ${
                      selectedAddress === address.id.toString()
                        ? 'border-brand-pink bg-brand-pink-light'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={selectedAddress === address.id.toString()}
                      onChange={(e) => setSelectedAddress(e.target.value)}
                      className="mt-1 h-4 w-4 text-brand-pink"
                    />
                    <div className="ml-3">
                      <p className="font-semibold text-brand-purple">
                        {address.label || 'Address'}
                        {address.isDefault && (
                          <span className="ml-2 text-xs bg-brand-pink text-white px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {address.line1}{address.line2 && `, ${address.line2}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {address.city}, {address.state} {address.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-brand-purple mb-4">Payment Method</h2>
            <div className="space-y-3">
              {[
                { value: 'COD', title: 'Cash on Delivery', desc: 'Pay when you receive', icon: '💵' },
                { value: 'RAZORPAY', title: 'Pay Online', desc: 'Credit/Debit Card, UPI, Net Banking', icon: '💳' },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-colors ${
                    paymentMethod === method.value
                      ? 'border-brand-pink bg-brand-pink-light'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={paymentMethod === method.value as 'COD' | 'RAZORPAY'}
                    onChange={() => setPaymentMethod(method.value as 'COD' | 'RAZORPAY')}
                    className="h-4 w-4 text-brand-pink"
                  />
                  <span className="ml-3 text-xl">{method.icon}</span>
                  <div className="ml-3">
                    <p className="font-semibold text-brand-purple">{method.title}</p>
                    <p className="text-sm text-gray-400">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 mt-8 lg:mt-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-bold text-brand-purple mb-4">Order Summary</h2>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-500 truncate mr-2">{item.name} × {item.quantity}</span>
                  <span className="text-brand-purple font-medium shrink-0">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="text-brand-purple font-medium">{formatPrice(subtotal)}</span>
              </div>
              {delivery && (
                <div className="flex justify-between text-gray-500">
                  <span>Delivery</span>
                  <span className={delivery.deliveryCharge === 0 ? 'text-green-600 font-medium' : 'text-brand-purple font-medium'}>
                    {delivery.deliveryCharge === 0 ? 'Free' : formatPrice(delivery.deliveryCharge)}
                  </span>
                </div>
              )}
              {delivery?.estimate && (
                <p className="text-xs text-green-600">Est. delivery: {delivery.estimate}</p>
              )}
            </div>

            <div className="border-t border-gray-100 mt-3 pt-3">
              <div className="flex justify-between text-lg font-bold text-brand-purple">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              variant="pink"
              fullWidth
              size="lg"
              onClick={handlePlaceOrder}
              isLoading={isLoading}
              disabled={!selectedAddress || addresses.length === 0}
              className="mt-5"
            >
              Place Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
