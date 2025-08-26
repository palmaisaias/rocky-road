import { motion } from 'framer-motion'

type Props = {
  title: string
  subtitle?: string
  steps: string[]
  note?: string
}

export default function SnackCard({ title, subtitle, steps, note }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.45 }}
      className="card-frame h-100"
    >
      <h3 className="h6 fw-semibold mb-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{title}</h3>
      {subtitle && <p className="text-secondary small mb-2">{subtitle}</p>}
      <ol className="ps-3 mb-0 small">
        {steps.map((s, i) => (
          <li key={i} className="mb-1">{s}</li>
        ))}
      </ol>
      {note && <p className="text-secondary small mt-2 mb-0">{note}</p>}
    </motion.article>
  )
}