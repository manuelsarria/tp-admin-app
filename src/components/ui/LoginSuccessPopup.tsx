'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import Image from 'next/image'

interface LoginSuccessPopupProps {
  open: boolean
  onClose: () => void
}

export function LoginSuccessPopup({ open, onClose }: LoginSuccessPopupProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setShowContent(true), 200)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'white',
          borderRadius: '1rem',
          overflow: 'hidden',
        }
      }}
    >
      <DialogContent 
        className="p-0" 
        sx={{ 
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box className="relative">
          {/* Close Button */}
          <Box className="absolute top-4 right-4 z-30">
            <IconButton
              onClick={onClose}
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Image */}
          <Image
            src="/images/ads.jpeg"
            alt="TP Logistics"
            width={600}
            height={400}
            className="w-full h-auto"
            style={{ 
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  )
}