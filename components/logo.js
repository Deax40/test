export default function Logo({ subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/engel-logo.svg" alt="ENGEL" className="h-8 w-auto" />
      {subtitle && <span className="text-muted text-sm">• {subtitle}</span>}
    </div>
  )
}
