'use client'

import { useState, useEffect } from 'react'

const POPUP_SHOWN_KEY = 'login-success-popup-shown'
const SHOW_WELCOME_KEY = 'show-welcome-popup'

export function useLoginSuccessPopup() {
  const [showPopup, setShowPopup] = useState(false)

  // Check if popup has been shown before
  const hasBeenShown = () => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(POPUP_SHOWN_KEY) === 'true'
  }

  // Mark popup as shown
  const markAsShown = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(POPUP_SHOWN_KEY, 'true')
      localStorage.removeItem(SHOW_WELCOME_KEY)
    }
  }

  // Check if we should show popup on dashboard load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldShow = localStorage.getItem(SHOW_WELCOME_KEY) === 'true'
      const alreadyShown = hasBeenShown()

      if (shouldShow && !alreadyShown) {
        setShowPopup(true)
      }
    }
  }, [])

  // Show popup if it hasn't been shown before
  const triggerPopup = () => {
    if (!hasBeenShown()) {
      setShowPopup(true)
    }
  }

  // Close popup and mark as shown
  const closePopup = () => {
    setShowPopup(false)
    markAsShown()
  }

  // Reset popup state (useful for testing or admin purposes)
  const resetPopupState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(POPUP_SHOWN_KEY)
      localStorage.removeItem(SHOW_WELCOME_KEY)
    }
  }

  return {
    showPopup,
    triggerPopup,
    closePopup,
    hasBeenShown: hasBeenShown(),
    resetPopupState,
  }
}