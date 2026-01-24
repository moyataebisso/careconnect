'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Slide {
  step: number
  title: string
  description: string
  icon: React.ReactNode
}

interface ProviderTutorialSlideshowProps {
  variant: 'preview' | 'medium' | 'full'
}

const slides: Slide[] = [
  {
    step: 1,
    title: 'Create Your Account',
    description: 'Sign up with your email and basic information in just 2 minutes',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    step: 2,
    title: 'Complete Your Facility Profile',
    description: 'Add your 245D license, services offered, photos, and description to attract referrals',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: 'Get Verified & Approved',
    description: 'Our team reviews your 245D license and approves your listing within 24-48 hours',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    step: 4,
    title: 'Activate Your Subscription',
    description: 'Start your $99.99/month subscription to go live and receive referrals',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    step: 5,
    title: 'Start Receiving Referrals',
    description: 'Connect with case managers, social workers, and families seeking care across Minnesota',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
]

const SLIDE_DURATION = 5000 // 5 seconds per slide

export default function ProviderTutorialSlideshow({ variant }: ProviderTutorialSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
    setProgress(0)
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setProgress(0)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setProgress(0)
  }, [])

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  // Auto-play and progress bar
  useEffect(() => {
    if (!isPlaying) return

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide()
          return 0
        }
        return prev + (100 / (SLIDE_DURATION / 50))
      })
    }, 50)

    return () => clearInterval(progressInterval)
  }, [isPlaying, nextSlide])

  const isPreview = variant === 'preview'
  const isMedium = variant === 'medium'
  const slide = slides[currentSlide]

  const containerWidth = isPreview ? 'max-w-md' : isMedium ? 'max-w-3xl' : 'max-w-4xl'
  const padding = isPreview ? 'p-4' : isMedium ? 'p-6 md:p-10' : 'p-6 md:p-10'

  return (
    <div className={`relative ${containerWidth} mx-auto`}>
      {/* Main Container */}
      <div
        className={`
          relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100
          ${padding}
        `}
      >
        {/* Video-like top bar with play/pause */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span className={`font-semibold text-gray-700 ${isPreview ? 'text-sm' : 'text-base'}`}>
              Provider Tutorial
            </span>
          </div>
          <span className={`font-medium text-gray-600 ${isPreview ? 'text-sm' : 'text-base'}`}>
            Step {slide.step} of {slides.length}
          </span>
        </div>

        {/* Slide Content */}
        <div className={`relative ${isPreview ? 'min-h-[200px]' : isMedium ? 'min-h-[260px] md:min-h-[300px]' : 'min-h-[300px] md:min-h-[350px]'}`}>
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className={`
              absolute left-0 top-1/2 -translate-y-1/2 z-10
              bg-white hover:bg-gray-50 shadow-lg rounded-full border border-gray-200
              transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isPreview ? 'w-10 h-10 -ml-2' : 'w-12 h-12 -ml-4 md:-ml-6'}
            `}
            aria-label="Previous slide"
          >
            <svg className={`${isPreview ? 'w-5 h-5' : 'w-6 h-6'} mx-auto text-gray-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className={`
              absolute right-0 top-1/2 -translate-y-1/2 z-10
              bg-white hover:bg-gray-50 shadow-lg rounded-full border border-gray-200
              transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isPreview ? 'w-10 h-10 -mr-2' : 'w-12 h-12 -mr-4 md:-mr-6'}
            `}
            aria-label="Next slide"
          >
            <svg className={`${isPreview ? 'w-5 h-5' : 'w-6 h-6'} mx-auto text-gray-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Slide Animation Container */}
          <div className="flex flex-col items-center justify-center h-full px-8 md:px-16">
            {/* Icon/Visual */}
            <div
              className={`
                bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 md:mb-6 shadow-lg
                transition-all duration-500 ease-out
                ${isPreview ? 'w-16 h-16' : isMedium ? 'w-24 h-24 md:w-28 md:h-28' : 'w-28 h-28 md:w-32 md:h-32'}
              `}
              style={{
                animation: 'fadeSlideIn 0.5s ease-out',
              }}
            >
              <div className={`${isPreview ? 'w-8 h-8' : isMedium ? 'w-12 h-12 md:w-14 md:h-14' : 'w-14 h-14 md:w-16 md:h-16'} text-white`}>
                {slide.icon}
              </div>
            </div>

            {/* Step Number Badge */}
            <div
              className={`
                bg-blue-100 text-blue-700 rounded-full font-bold mb-3
                ${isPreview ? 'w-7 h-7 text-sm' : 'w-10 h-10 text-base'}
                flex items-center justify-center
              `}
            >
              {slide.step}
            </div>

            {/* Title */}
            <h3
              className={`
                font-bold text-gray-900 text-center mb-3
                ${isPreview ? 'text-lg' : isMedium ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}
              `}
              key={`title-${currentSlide}`}
              style={{
                animation: 'fadeSlideIn 0.5s ease-out 0.1s both',
              }}
            >
              {slide.title}
            </h3>

            {/* Description */}
            <p
              className={`
                text-gray-600 text-center max-w-lg leading-relaxed
                ${isPreview ? 'text-sm' : isMedium ? 'text-base md:text-lg' : 'text-lg md:text-xl'}
              `}
              key={`desc-${currentSlide}`}
              style={{
                animation: 'fadeSlideIn 0.5s ease-out 0.2s both',
              }}
            >
              {slide.description}
            </p>

            {/* CTA Button on Last Slide */}
            {currentSlide === slides.length - 1 && (
              <Link
                href="/register"
                className={`
                  mt-5 md:mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl
                  transition-all hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isPreview ? 'px-5 py-3 text-sm' : 'px-8 py-4 text-base md:text-lg min-h-[52px]'}
                `}
                style={{
                  animation: 'fadeSlideIn 0.5s ease-out 0.3s both',
                }}
              >
                Get Started
              </Link>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-50 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-3 mt-5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isPreview ? 'w-3 h-3' : isMedium ? 'w-4 h-4' : 'w-4 h-4'}
                ${index === currentSlide
                  ? 'bg-blue-600 scale-110'
                  : 'bg-gray-300 hover:bg-gray-400'
                }
              `}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>

    </div>
  )
}
