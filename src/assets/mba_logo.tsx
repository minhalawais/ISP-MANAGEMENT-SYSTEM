import React from 'react';
import { useCompany } from '../context/CompanyContext.tsx';

interface MBALogoProps {
  variant?: 'landscape' | 'square' | 'navbar';
  companyName?: string;
}

const MBALogo: React.FC<MBALogoProps> = ({ variant = 'landscape', companyName }) => {
  const isSquare = variant === 'square';
  const isNavbar = variant === 'navbar';
  const { company } = useCompany();
  const contextName = company?.name || '';

  const rawName = (companyName || contextName || 'MBA COMMUNICATIONS').trim();
  const upperName = rawName.toUpperCase();
  const words = upperName.split(' ');

  let line1 = '';
  let line2 = '';

  if (words.length === 1) {
    line1 = words[0];
  } else if (words.length === 2) {
    line1 = words[0];
    line2 = words[1];
  } else {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(' ');
    line2 = words.slice(mid).join(' ');
  }

  // Adjust font size dynamically if the company name string is long
  const longestLine = line1.length > line2.length ? line1 : line2;
  let fontSize = '48px';
  if (longestLine.length > 20) {
    fontSize = '28px';
  } else if (longestLine.length > 15) {
    fontSize = '34px';
  } else if (longestLine.length > 10) {
    fontSize = '40px';
  }

  if (isNavbar) {
    return (
      <button
        type="button"
        className="flex h-10 items-center rounded-md text-left transition-opacity hover:opacity-90"
        onClick={() => window.location.href = '/customer-management'}
        aria-label={`${rawName} home`}
      >
        <span className="flex min-w-0 flex-col justify-center leading-none">
          <span className="whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.04em] text-[#1E3A5F]">
            {line1}
          </span>
          {line2 && (
            <span className="mt-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {line2}
            </span>
          )}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`w-full mx-auto ${isSquare ? 'max-w-xs' : 'max-w-md'} cursor-pointer`}
      onClick={() => window.location.href = '/customer-management'}
    >
      <svg
        viewBox={isSquare ? "0 0 200 200" : "0 0 500 200"}
        className="w-full h-full object-contain"
        xmlns="http://www.w3.org/2000/svg"
      >

        {isSquare ? (
          // Square variant for login page
          <g transform="translate(20, 20)">
            <path
              d="
                M 80,5
                C 45,5 25,5 15,15
                C 5,25 5,45 5,80
                C 5,115 5,135 15,145
                C 25,155 45,155 80,155
                C 115,155 135,155 145,145
                C 155,135 155,115 155,80
                C 155,45 155,25 145,15
                C 135,5 115,5 80,5
                Z"
              fill="url(#hexGradient)"
              filter="url(#shadow)"
            />

            <path
              d="M 35,45 C 35,45 80,25 125,45"
              stroke="#FFFFFF"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />

            <path
              d="M 35,115 C 35,115 80,135 125,115"
              stroke="#FFFFFF"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />

            <text
              x="80"
              y="95"
              textAnchor="middle"
              fill="white"
              style={{
                fontSize: words[0].length > 6 ? '24px' : '38px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}
            >
              {words[0]}
            </text>
          </g>
        ) : (
          // Landscape variant with dynamic company name (no left margin padding)
          <>
            {line2 ? (
              <>
                <text
                  x="10"
                  y="90"
                  fill="#1A1A1A"
                  style={{
                    fontSize,
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 'bold',
                    letterSpacing: '1px'
                  }}
                >
                  {line1}
                </text>
                <text
                  x="10"
                  y="140"
                  fill="#1A1A1A"
                  style={{
                    fontSize,
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 'bold',
                    letterSpacing: '1px'
                  }}
                >
                  {line2}
                </text>
              </>
            ) : (
              <text
                x="10"
                y="115"
                fill="#1A1A1A"
                style={{
                  fontSize,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 'bold',
                  letterSpacing: '1px'
                }}
              >
                {line1}
              </text>
            )}

            <text
              x="380"
              y="130"
              fill="#404040"
              style={{
                fontSize: '12px',
                fontFamily: 'Montserrat, sans-serif'
              }}
            >
              ®
            </text>

            <text
              x="10"
              y="170"
              fill="#404040"
              style={{
                fontSize: '18px',
                fontFamily: 'Montserrat, sans-serif',
                letterSpacing: '3px'
              }}
            >
              INTERNET SERVICE PROVIDER
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

export default MBALogo;
