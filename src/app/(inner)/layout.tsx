"use client"

import { MainNav } from '@/components/main-nav'
import { ModeToggle } from '@/components/dark-mode-toggle'
import React from 'react'

export default function InnerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="border-b">
                <div className="flex h-16 items-center px-4">
                    <MainNav className="mx-6" />
                    <div className="ml-auto flex items-center space-x-4">
                        <ModeToggle />
                    </div>
                </div>
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    )
}