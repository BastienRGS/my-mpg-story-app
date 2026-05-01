import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/60 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,background-color,border-color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-border/70 bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/92',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border-border/80 bg-card/70 text-foreground [a&]:hover:bg-secondary [a&]:hover:text-foreground',
        leagueL1:
          'border-transparent bg-[#3ddc84] font-bold text-[#0d0d0d] [a&]:hover:bg-[#3ddc84]/90',
        leagueL2:
          'border border-[#333333] bg-[#1a1a1a] font-semibold text-[#666666] [a&]:hover:bg-[#1a1a1a]/95',
        lore:
          'border border-[#3ddc8430] bg-[#3ddc8415] font-normal italic text-[#3ddc84]',
        crisis:
          'border border-[#ff444440] bg-[#2a0a0a] font-semibold text-[#ff4444]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
