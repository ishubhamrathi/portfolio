export default function TechIcon({ icon }) {
  if (!icon) return null
  if (/^https?:\/\//i.test(icon)) {
    return (
      <img src={icon} alt="" loading="lazy" className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />
    )
  }
  return <span className="mr-1">{icon}</span>
}
