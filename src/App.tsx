import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SiteHeader } from './components/layout/SiteHeader'
import { MeetingProvider } from './context/MeetingContext'
import { TodoProvider } from './context/TodoContext'
import { AboutPage } from './pages/AboutPage'
import { MeetingPage } from './pages/MeetingPage'
import { TodoPage } from './pages/TodoPage'

function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="absolute top-3 left-3 z-50 -translate-y-16 rounded-lg bg-bg-elevated px-3 py-2 text-sm font-semibold text-ink shadow-panel transition-transform duration-200 focus:translate-y-0"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Routes>
          <Route
            path="/"
            element={
              <TodoProvider>
                <TodoPage />
              </TodoProvider>
            }
          />
          <Route
            path="/meetings"
            element={
              <MeetingProvider>
                <MeetingPage />
              </MeetingProvider>
            }
          />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
