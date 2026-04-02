import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonBaseClass =
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border text-sm font-semibold tracking-[-0.01em] transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out outline-none select-none focus-visible:border-[rgba(36,72,143,0.35)] focus-visible:ring-4 focus-visible:ring-[rgba(36,72,143,0.14)] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const buttonToneVariants = {
  primary:
    "border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,#26478d_0%,#18305d_100%)] text-white shadow-[0_14px_30px_rgba(24,48,93,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] hover:-translate-y-px hover:shadow-[0_18px_36px_rgba(24,48,93,0.34),inset_0_1px_0_rgba(255,255,255,0.2)]",
  neutral:
    "border-slate-200/90 bg-white text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.72)] hover:-translate-y-px hover:border-slate-300 hover:text-slate-900 hover:shadow-[0_16px_34px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.78)]",
  subtle:
    "border-slate-200/80 bg-slate-100/95 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] hover:-translate-y-px hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]",
  ghost:
    "border-transparent bg-transparent text-slate-700 shadow-none hover:-translate-y-px hover:border-slate-200/90 hover:bg-white hover:text-slate-900 hover:shadow-[0_12px_26px_rgba(15,23,42,0.08)]",
  destructive:
    "border-[rgba(255,255,255,0.14)] bg-[linear-gradient(180deg,#d33f4d_0%,#a61e35_100%)] text-white shadow-[0_14px_30px_rgba(166,30,53,0.24),inset_0_1px_0_rgba(255,255,255,0.16)] hover:-translate-y-px hover:shadow-[0_18px_36px_rgba(166,30,53,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]",
}

const buttonSizeVariants = {
  default:
    "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
  xs: "h-7 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
  sm: "h-8 gap-1.5 px-3.5 text-[0.82rem] [&_svg:not([class*='size-'])]:size-3.5",
  lg: "h-11 gap-2 px-5 text-sm [&_svg:not([class*='size-'])]:size-4",
  icon: "size-10",
  "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
  "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
  "icon-lg": "size-11",
}

const rawButtonVariants = cva(buttonBaseClass, {
  variants: {
    variant: {
      primary: buttonToneVariants.primary,
      neutral: buttonToneVariants.neutral,
      subtle: buttonToneVariants.subtle,
      ghost: buttonToneVariants.ghost,
      destructive: buttonToneVariants.destructive,
    },
    size: buttonSizeVariants,
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
})

const buttonVariants = cva(
  buttonBaseClass,
  {
    variants: {
      variant: {
        default: buttonToneVariants.primary,
        outline: buttonToneVariants.neutral,
        secondary: buttonToneVariants.subtle,
        ghost: buttonToneVariants.ghost,
        destructive: buttonToneVariants.destructive,
        link:
          "h-auto rounded-none border-transparent bg-transparent px-0 text-primary shadow-none hover:translate-y-0 hover:underline",
      },
      size: buttonSizeVariants,
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants, rawButtonVariants }
