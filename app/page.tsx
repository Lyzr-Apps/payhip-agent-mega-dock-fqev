'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FiPackage,
  FiAlertCircle,
  FiExternalLink,
  FiLock
} from 'react-icons/fi'
import { HiOutlineSparkles } from 'react-icons/hi2'

// ========================
// OFFLINE PAGE
// ========================

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <HiOutlineSparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">RULE 47</h1>
            <p className="text-sm text-muted-foreground">Digital Product Factory</p>
          </div>
        </div>

        {/* Offline notice */}
        <Card className="shadow-lg border-destructive/30">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <FiLock className="w-7 h-7 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">App Unavailable</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This application has been taken offline and is no longer available on the marketplace.
              </p>
            </div>

            <Separator />

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 text-left">
              <FiAlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Delisted from marketplace</p>
                <p className="text-xs text-muted-foreground">
                  The RULE 47 Digital Product Factory is no longer accepting new visitors.
                  All existing products remain accessible through the Payhip store.
                </p>
              </div>
            </div>

            <Badge variant="secondary" className="text-xs">
              <FiPackage className="w-3 h-3 mr-1" /> Status: Offline
            </Badge>
          </CardContent>
        </Card>

        {/* Store link - still accessible */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <a
              href="https://payhip.com/RULE47"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-green-700">RULE 47 Store</p>
                <p className="text-xs text-green-600">Existing products are still available on Payhip</p>
              </div>
              <FiExternalLink className="w-4 h-4 text-green-600 shrink-0" />
            </a>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          RULE 47 Digital Product Factory
        </p>
      </div>
    </div>
  )
}
