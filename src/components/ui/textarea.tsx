import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-lg border border-slate-300/80 bg-white/85 px-3 py-2 text-base shadow-sm transition-all outline-none placeholder:text-slate-400 hover:border-slate-400/80 focus-visible:border-sky-500 focus-visible:ring-3 focus-visible:ring-sky-200/70 disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
