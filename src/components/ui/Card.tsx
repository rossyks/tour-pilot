import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-[#e8e8e8] rounded-2xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
