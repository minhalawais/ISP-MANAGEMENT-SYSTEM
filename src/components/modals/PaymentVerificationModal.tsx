import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, CreditCard, Hash, FileText, AlertCircle, Loader2 } from 'lucide-react';
import axiosInstance from '../../utils/axiosConfig.ts';
import { toast } from 'react-toastify';

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
  onVerify: () => void;
}

export const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({
  isOpen,
  onClose,
  payment,
  onVerify,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch payment proof image with authentication
  useEffect(() => {
    if (isOpen && payment?.payment_proof) {
      setIsLoadingImage(true);
      setImageError(false);
      
      axiosInstance.get(`/payments/proof-image/${payment.id}`, {
        responseType: 'blob'
      })
        .then((response) => {
          const url = URL.createObjectURL(response.data);
          setProofImageUrl(url);
        })
        .catch((error) => {
          console.error('Failed to load payment proof:', error);
          setImageError(true);
        })
        .finally(() => {
          setIsLoadingImage(false);
        });
    }
    
    // Cleanup blob URL on unmount
    return () => {
      if (proofImageUrl) {
        URL.revokeObjectURL(proofImageUrl);
      }
    };
  }, [isOpen, payment?.id, payment?.payment_proof]);

  if (!isOpen || !payment) return null;

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (action === 'reject' && !rejectReason.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosInstance.post(`/payments/verify/${payment.id}`, {
        action,
        notes: action === 'reject' ? rejectReason : null
      });
      
      toast.success(`Payment ${action}ed successfully`);
      onVerify();
      onClose();
    } catch (error: any) {
      console.error(`Failed to ${action} payment`, error);
      toast.error(error.response?.data?.message || `Failed to ${action} payment`);
    } finally {
      setIsSubmitting(false);
      setShowRejectInput(false);
      setRejectReason('');
    }
  };

  const handleDownloadProof = async () => {
    try {
      const response = await axiosInstance.get(`/payments/proof-image/${payment.id}`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-proof-${payment.invoice_number}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download payment proof');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Verify Payment</h2>
            <p className="text-sm text-gray-500 mt-1">Review transaction details and proof</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Details */}
            <div className="space-y-6">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4" /> Transaction Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Invoice #</span>
                    <span className="text-sm font-medium text-gray-900">{payment.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="text-lg font-bold text-green-600">PKR {payment.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Date</span>
                    <span className="text-sm font-medium text-gray-900">{payment.payment_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Customer</span>
                    <span className="text-sm font-medium text-gray-900">{payment.customer_name}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment Info
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Method</span>
                    <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
                      {payment.payment_method}
                    </span>
                  </div>
                  {payment.transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Transaction ID</span>
                      <span className="text-sm font-mono text-gray-900">{payment.transaction_id}</span>
                    </div>
                  )}
                  {payment.bank_account_details && (
                     <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-500">Bank Account</span>
                      <span className="text-sm font-medium text-gray-900 text-right">{payment.bank_account_details}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Proof */}
            <div className="flex flex-col h-full">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Payment Proof
              </h3>
              <div className="flex-1 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden min-h-[300px] relative group">
                {payment.payment_proof ? (
                  isLoadingImage ? (
                    <div className="flex flex-col items-center text-gray-400">
                      <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                      <span className="text-sm">Loading proof...</span>
                    </div>
                  ) : imageError ? (
                    <div className="text-gray-400 text-sm flex flex-col items-center">
                      <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                      Image not available
                    </div>
                  ) : proofImageUrl ? (
                    <>
                      <img 
                        src={proofImageUrl} 
                        alt="Payment Proof" 
                        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={handleDownloadProof}
                          className="bg-black/75 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black"
                        >
                          Download
                        </button>
                      </div>
                    </>
                  ) : null
                ) : (
                  <div className="text-gray-400 text-sm flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                    No proof attached
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rejection Input */}
          {showRejectInput && (
            <div className="mt-6 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please explain why this payment is being rejected..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none h-24 text-sm"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          {showRejectInput ? (
            <>
               <button
                onClick={() => setShowRejectInput(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={!rejectReason.trim() || isSubmitting}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-red-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </>
          ) : (
             <>
              <button
                onClick={() => handleAction('reject')}
                disabled={isSubmitting}
                className="px-6 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => handleAction('approve')}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-green-200 transition-all transform active:scale-95 flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Approve Payment
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
