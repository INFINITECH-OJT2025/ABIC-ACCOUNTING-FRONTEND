import * as React from "react"

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
  <div className="relative inline-block text-left">{children}</div>
)

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, ...props }, ref) => (
  <button ref={ref} {...props} />
))
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
  <div
    ref={ref}
    className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg z-50 ${props.className || ""}`}
    {...props}
  />
))
DropdownMenuContent.displayName = "DropdownMenuContent"

export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void }
>(({ ...props }, ref) => (
  <div
    ref={ref}
    className={`px-4 py-2 cursor-pointer hover:bg-white/10 ${props.className || ""}`}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"
