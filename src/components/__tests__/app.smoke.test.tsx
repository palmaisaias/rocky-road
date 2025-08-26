import { render, screen } from '@testing-library/react'
import App from '../../App'

describe('App smoke', () => {
  it('renders Hummel header and at least 4 snack cards and a video', () => {
    render(<App />)
    expect(screen.getByText(/SECURE TRANSMISSION - GENERAL HUMMEL/i)).toBeInTheDocument()
    // 4 snack titles present
    expect(screen.getByText(/Green Balls/i)).toBeInTheDocument()
    expect(screen.getByText(/Sourdough Bites/i)).toBeInTheDocument()
    expect(screen.getByText(/Smokies/i)).toBeInTheDocument()
    expect(screen.getByText(/Nacho Bar/i)).toBeInTheDocument()
    // video element
    const video = document.querySelector('video')
    expect(video).toBeTruthy()
  })
})