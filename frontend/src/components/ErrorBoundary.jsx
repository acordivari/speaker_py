import { Component } from 'react'

/**
 * Last-resort error boundary around the whole app. Without it, any render
 * error unmounts the entire React tree and leaves a blank screen with no
 * recovery path — on mobile there isn't even a devtools console to check.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        role="alert"
        className="flex items-center justify-center h-screen font-mono"
        style={{ background: 'var(--color-bg)' }}
      >
        <div className="text-center space-y-3 px-6">
          <div className="text-3xl font-bold" style={{ color: '#ff3d00' }}>
            ⚠ Something went wrong
          </div>
          <div className="text-sm max-w-sm mx-auto" style={{ color: 'var(--color-text-2)' }}>
            {this.state.error?.message ?? 'Unexpected error'}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-mono px-4 py-2 rounded border transition-colors duration-200"
            style={{ borderColor: '#00e5ff66', color: '#00e5ff', background: 'transparent' }}
          >
            ↻ RELOAD
          </button>
        </div>
      </div>
    )
  }
}
