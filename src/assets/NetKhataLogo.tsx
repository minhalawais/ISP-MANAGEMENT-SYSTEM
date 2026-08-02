import React from 'react';

// Import new logo assets
import HorizontalLogo from './net_khata_horizontal.png';
import StackedLogo from './net_khata_stacked.png';
import Favicon from './favicon.png';

interface NetKhataLogoProps {
    variant?: 'landscape' | 'square' | 'icon';
    className?: string;
    style?: React.CSSProperties;
}

const NetKhataLogo: React.FC<NetKhataLogoProps> = ({
    variant = 'landscape',
    className = "",
    style
}) => {
    let logoSrc;
    let altText = "Net Khata Logo";

    switch (variant) {
        case 'icon':
            logoSrc = Favicon;
            break;
        case 'square':
            logoSrc = StackedLogo;
            break;
        case 'landscape':
        default:
            logoSrc = HorizontalLogo;
            break;
    }

    return (
        <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
                src={logoSrc}
                alt={altText}
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                }}
            />
        </div>
    );
};

export default NetKhataLogo;
