import React from 'react';
import Image from 'next/image';

interface WhatsAppIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  size?: number;
}

export function WhatsAppIcon({ className = 'w-4 h-4', size = 24, ...props }: WhatsAppIconProps) {
  return (
    <img
      src="/whatsapp-logo.png"
      alt="WhatsApp"
      width={size}
      height={size}
      className={`inline-block object-contain shrink-0 ${className}`}
      {...props}
    />
  );
}
