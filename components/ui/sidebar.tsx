"use client"

import React, { createContext, useContext, useState, type ReactNode, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

type SidebarContextType = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

const SidebarProvider = ({ children }: { children: ReactNode }) => {
  // 初期値をtrueに変更して、初期表示時にサイドバーを表示する
  const [isOpen, setIsOpen] = useState(true)

  // ローカルストレージからサイドバーの状態を復元する
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-state")
    if (savedState !== null) {
      setIsOpen(savedState === "true")
    }
  }, [])

  // サイドバーの状態が変更されたときにローカルストレージに保存する
  useEffect(() => {
    localStorage.setItem("sidebar-state", isOpen.toString())
  }, [isOpen])

  return <SidebarContext.Provider value={{ isOpen, setIsOpen }}>{children}</SidebarContext.Provider>
}

const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => {
    const { isOpen } = useSidebar()
    const isMobile = useIsMobile()

    return (
      <div
        ref={ref}
        className={cn(
          "bg-secondary border-r border-secondary-foreground/10 fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col p-4 transition-all duration-300",
          !isOpen && "transform -translate-x-full",
          isMobile && "block",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Sidebar.displayName = "Sidebar"

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("flex-1 overflow-y-auto py-2 text-sm", className)} {...props} />
})
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("mt-auto border-t border-secondary-foreground/10 pt-4", className)} {...props} />
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("space-y-1", className)} {...props} />
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("", className)} {...props} />
  },
)
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("px-3 py-2 text-sm font-medium text-muted-foreground", className)} {...props} />
  },
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("px-3 py-2", className)} {...props} />
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(({ className, ...props }, ref) => {
  return <ul ref={ref} className={cn("space-y-1", className)} {...props} />
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => {
  return <li ref={ref} className={cn("", className)} {...props} />
})
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(
          "w-full justify-start data-[state=open]:bg-secondary data-[state=open]:text-secondary-foreground",
          className,
        )}
        {...props}
      />
    )
  },
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
}
