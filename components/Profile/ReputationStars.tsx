type Props = {
  score: number
  total: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const starSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
}
const numSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-lg',
}

export default function ReputationStars({ score, total, size = 'md' }: Props) {
  // Round to nearest integer for filled stars display
  const filled = Math.min(5, Math.max(0, Math.round(score)))

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className={`flex gap-0.5 ${starSizes[size]}`}>
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className={i <= filled ? '' : 'grayscale opacity-25'}
          >
            ⭐
          </span>
        ))}
      </div>
      <span className={`font-bold text-gray-800 ${numSizes[size]}`}>
        {score.toFixed(1)}
      </span>
      {total > 0 ? (
        <span className={`text-gray-400 ${numSizes[size]}`}>
          ({total} {total === 1 ? 'calificación' : 'calificaciones'})
        </span>
      ) : (
        <span className={`text-gray-400 ${numSizes[size]}`}>Sin calificaciones</span>
      )}
    </div>
  )
}
