import React from 'react';

const MBALogo = ({ variant = 'landscape' }) => {
  const isSquare = variant === 'square';
  
  return (
    <div
      className={`w-full mx-auto ${isSquare ? 'max-w-xs' : 'max-w-md'} cursor-pointer`}
      onClick={() => window.location.href = '/customer-management'}
    >      
    <svg
        viewBox={isSquare ? "0 0 200 200" : "0 0 700 200"}
        className="w-full h-full object-contain"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D2D2D" />
            <stop offset="35%" stopColor="#404040" />
            <stop offset="70%" stopColor="#333333" />
            <stop offset="100%" stopColor="#1A1A1A" />
          </linearGradient>
          
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="2" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
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
                fontSize: '38px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}
            >
              MBA
            </text>
          </g>
        ) : (
          // Landscape variant
          <>
            <g transform="translate(10, 40)">
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
                  fontSize: '38px',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  letterSpacing: '1px'
                }}
              >
                MBA
              </text>
            </g>
            
            <text
              x="200"
              y="90"
              fill="#1A1A1A"
              style={{ 
                fontSize: '48px',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}
            >
              MBA
            </text>
            <text
              x="200"
              y="140"
              fill="#1A1A1A"
              style={{ 
                fontSize: '48px',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}
            >
              COMMUNICATIONS
            </text>
            
            <text
              x="570"
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
              x="200"
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