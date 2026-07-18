// Cropped from a 5x2 face-grid image via background-position — no interactivity, safe in server components.
export function GridAvatar({
  col, row, className,
}: { col: number; row: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        backgroundImage: `url(/avatars/face-${row}-${col}.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  )
}
