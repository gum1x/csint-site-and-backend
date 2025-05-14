import type { ReactNode } from "react"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 p-5 md:p-6 shadow-xl transition-all-500 hover:shadow-emerald-900/20 h-full hover-lift overflow-hidden relative">
      {/* Add subtle shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 animate-shimmer transition-opacity duration-300"></div>

      <div className="mb-4 rounded-full bg-gray-800 p-3 inline-flex transition-transform duration-500 group-hover:scale-110 group-hover:bg-gray-750 group-hover:text-emerald-400">
        {icon}
      </div>
      <h3 className="mb-2 md:mb-3 text-lg md:text-xl font-semibold group-hover:text-emerald-300 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-sm md:text-base text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
        {description}
      </p>
    </div>
  )
}
