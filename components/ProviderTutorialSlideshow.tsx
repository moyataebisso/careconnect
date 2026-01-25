'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Slide {
  step: number
  title: string
  description: string
  image: string
}

interface ProviderTutorialSlideshowProps {
  variant: 'preview' | 'medium' | 'full'
}

const slides: Slide[] = [
  {
    step: 1,
    title: 'Create Your Account',
    description: 'Sign up with your email and password to get started - it\'s free to create an account',
    image: 'https://lfffmzomhcyixrduddio.supabase.co/storage/v1/object/public/tutorial-images/Screenshot%202026-01-24%20201944.png',
  },
  {
    step: 2,
    title: 'Add Business Information',
    description: 'Enter your business name, 245D license number, contact person, and phone number',
    image: 'https://lfffmzomhcyixrduddio.supabase.co/storage/v1/object/public/tutorial-images/Screenshot%202026-01-24%20202138.png',
  },
  {
    step: 3,
    title: 'Set Your Location',
    description: 'Add your facility address so families and case managers can find you',
    image: 'https://lfffmzomhcyixrduddio.supabase.co/storage/v1/object/public/tutorial-images/Screenshot%202026-01-24%20202220.png',
  },
  {
    step: 4,
    title: 'Select Services & Capacity',
    description: 'Choose the 245D services you offer and waiver types you accept',
    image: 'https://lfffmzomhcyixrduddio.supabase.co/storage/v1/object/public/tutorial-images/Screenshot%202026-01-24%20202304.png',
  },
  {
    step: 5,
    title: 'Review & Complete',
    description: 'Add optional details, review your information, and complete registration',
    image: 'https://lfffmzomhcyixrduddio.supabase.co/storage/v1/object/public/tutorial-images/Screenshot%202026-01-24%20202341.png',
  },
]

const SLIDE_DURATION = 6000 // 6 seconds per slide

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

  const containerWidth = isPreview ? 'max-w-md' : isMedium ? 'max-w-4xl' : 'max-w-5xl'
  const padding = isPreview ? 'p-4' : isMedium ? 'p-6 md:p-8' : 'p-6 md:p-10'

  return (
    <div className={`relative ${containerWidth} mx-auto`}>
      {/* Main Container - DARK brown background to POP */}
      <div
        className={`
          relative rounded-2xl shadow-2xl overflow-hidden border-2 border-[#3D2E1F]
          ${padding}
        `}
        style={{ backgroundColor: '#5C4A32' }}
      >
        {/* Top bar with step indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className={`font-semibold text-[#EDE4D3] ${isPreview ? 'text-sm' : 'text-base'}`}>
            Provider Tutorial
          </span>
          <span className={`font-medium text-[#D4C4A8] ${isPreview ? 'text-sm' : 'text-base'}`}>
            Step {slide.step} of {slides.length}
          </span>
        </div>

        {/* Slide Content */}
        <div className={`relative ${isPreview ? 'min-h-[280px]' : isMedium ? 'min-h-[400px] md:min-h-[480px]' : 'min-h-[450px] md:min-h-[550px]'}`}>
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className={`
              absolute left-0 top-1/2 -translate-y-1/2 z-10
              bg-[#EDE4D3] hover:bg-white shadow-lg rounded-full border-2 border-[#5C4A32]
              transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#EDE4D3] focus:ring-offset-2 focus:ring-offset-[#5C4A32]
              ${isPreview ? 'w-10 h-10 -ml-2' : 'w-12 h-12 -ml-4 md:-ml-6'}
            `}
            aria-label="Previous slide"
          >
            <svg className={`${isPreview ? 'w-5 h-5' : 'w-6 h-6'} mx-auto text-[#5C4A32]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className={`
              absolute right-0 top-1/2 -translate-y-1/2 z-10
              bg-[#EDE4D3] hover:bg-white shadow-lg rounded-full border-2 border-[#5C4A32]
              transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#EDE4D3] focus:ring-offset-2 focus:ring-offset-[#5C4A32]
              ${isPreview ? 'w-10 h-10 -mr-2' : 'w-12 h-12 -mr-4 md:-mr-6'}
            `}
            aria-label="Next slide"
          >
            <svg className={`${isPreview ? 'w-5 h-5' : 'w-6 h-6'} mx-auto text-[#5C4A32]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Slide Animation Container */}
          <div className="flex flex-col items-center justify-start h-full px-4 md:px-12">
            {/* Step Badge and Title */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`
                  bg-[#EDE4D3] text-[#5C4A32] rounded-full font-bold
                  ${isPreview ? 'w-7 h-7 text-sm' : 'w-9 h-9 text-base'}
                  flex items-center justify-center
                `}
              >
                {slide.step}
              </div>
              <h3
                className={`
                  font-bold text-white
                  ${isPreview ? 'text-lg' : isMedium ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}
                `}
              >
                {slide.title}
              </h3>
            </div>

            {/* Description */}
            <p
              className={`
                text-[#EDE4D3] text-center max-w-2xl mb-4
                ${isPreview ? 'text-sm' : isMedium ? 'text-base' : 'text-lg'}
              `}
            >
              {slide.description}
            </p>

            {/* Screenshot Image - Keep white background */}
            <div 
              className={`
                relative w-full rounded-lg overflow-hidden shadow-xl border-2 border-[#3D2E1F] bg-white
                ${isPreview ? 'h-[180px]' : isMedium ? 'h-[280px] md:h-[340px]' : 'h-[320px] md:h-[400px]'}
              `}
              style={{
                animation: 'fadeSlideIn 0.4s ease-out',
              }}
            >
              <Image
                src={slide.image}
                alt={`Step ${slide.step}: ${slide.title}`}
                fill
                className="object-contain object-top"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
                priority={currentSlide === 0}
              />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-[#3D2E1F] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#EDE4D3] transition-all duration-50 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-3 mt-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#EDE4D3] focus:ring-offset-2 focus:ring-offset-[#5C4A32]
                ${isPreview ? 'w-3 h-3' : isMedium ? 'w-4 h-4' : 'w-4 h-4'}
                ${index === currentSlide
                  ? 'bg-[#EDE4D3] scale-110'
                  : 'bg-[#3D2E1F] hover:bg-[#6B5B47]'
                }
              `}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Play/Pause Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-[#EDE4D3] hover:bg-white flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#EDE4D3] focus:ring-offset-2 focus:ring-offset-[#5C4A32] shadow-lg"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-[#5C4A32]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[#5C4A32] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Persistent Register Button - Always visible below slideshow */}
      <div className="mt-6 text-center">
        <Link
          href="/register"
          className={`
            inline-flex items-center justify-center gap-2
            bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl
            transition-all hover:shadow-lg hover:-translate-y-0.5 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${isPreview ? 'px-6 py-3 text-base' : 'px-8 py-4 text-lg'}
          `}
        >
          <span>Register as a Provider</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <p className="mt-3 text-sm text-[#5C4A32]">
          Free to create an account • $99.99/month to go live
        </p>
      </div>
    </div>
  )
}