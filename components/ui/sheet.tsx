import * as React from "react"

export interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
  }, [open])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => onOpenChange?.(false)}
        />
      )}
      {children}
    </>
  )
}

export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`fixed right-0 top-0 z-50 h-full w-full border-l shadow-lg transition-transform duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out ${className}`}
      {...props}
    />
  )
)
SheetContent.displayName = "SheetContent"

export interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-2 text-center sm:text-left border-b ${className}`}
      {...props}
    />
  )
)
SheetHeader.displayName = "SheetHeader"

export interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ className = "", ...props }, ref) => (
    <h2
      ref={ref}
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  )
)
SheetTitle.displayName = "SheetTitle"

export interface SheetDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const SheetDescription = React.forwardRef<HTMLParagraphElement, SheetDescriptionProps>(
  ({ className = "", ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-slate-500 ${className}`}
      {...props}
    />
  )
)
SheetDescription.displayName = "SheetDescription"

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription }
