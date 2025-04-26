'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

interface MainNavProps extends React.HTMLAttributes<HTMLElement> { }

export function MainNav({
    className,
    ...props
}: MainNavProps) {
    const pathname = usePathname()

    const navItems = [
        { href: "/compare", label: "Compare" },
        { href: "/database", label: "Database" },
        { href: "/categories", label: "Categories" },
    ]

    return (
        <nav
            className={cn("flex items-center space-x-4 lg:space-x-6", className)}
            {...props}
        >
            {navItems.map(({ href, label }) => (
                <Link
                    key={href}
                    href={href}
                    className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        pathname === href
                            ? "text-primary"
                            : "text-muted-foreground"
                    )}
                >
                    {label}
                </Link>
            ))}
        </nav>
    )
}
