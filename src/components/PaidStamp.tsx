import React from 'react';

interface PaidStampProps {
    date?: string;
    method?: string;
    className?: string;
}

export const PaidStamp: React.FC<PaidStampProps> = ({ date, method, className = '' }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    };

    return (
        <div className={`flex flex-col items-center justify-center p-4 border-[5px] border-emerald-600 rounded-lg text-emerald-600 font-black uppercase tracking-widest transform -rotate-12 opacity-80 mix-blend-multiply select-none pointer-events-none ${className}`}>
            <div className="text-4xl leading-none">PAID</div>
            {(date || method) && (
                <div className="mt-1 flex flex-col items-center text-xs font-bold font-mono border-t-2 border-emerald-600 pt-1 w-full">
                    {date && <span>{formatDate(date)}</span>}
                    {method && <span className="text-[10px] mt-0.5">{method}</span>}
                </div>
            )}
        </div>
    );
};
