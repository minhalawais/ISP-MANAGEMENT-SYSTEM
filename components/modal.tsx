import React from 'react';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

export function Modal({ isVisible, onClose, title, children, isLoading }: ModalProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed z-50 inset-0 overflow-y-auto backdrop-blur-sm"
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="flex items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <div 
          className="fixed inset-0 bg-[#89A8B2] bg-opacity-30 transition-opacity h-full" 
          aria-hidden="true"
          onClick={onClose}
          style={{ height: '150%' }}
        />
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-[#F1F0E8] rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-modal">
          <div className="px-6 pt-6 pb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 
                className="text-xl font-semibold text-[#89A8B2]" 
                id="modal-title"
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-[#B3C8CF] hover:text-[#89A8B2] transition-colors duration-200"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            </div>
            {React.Children.map(children, child => {
              if (React.isValidElement(child) && child.type === 'form') {
                return React.cloneElement(child, { isLoading });
              }
              return child;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

