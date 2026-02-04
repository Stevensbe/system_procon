import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext({
    isOpen: true,
    toggleSidebar: () => { },
});

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

export const SidebarProvider = ({ children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <SidebarContext.Provider value={{ isOpen, toggleSidebar, setIsOpen }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const Sidebar = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <aside
        ref={ref}
        className={`flex flex-col h-full bg-white border-r ${className}`}
        {...props}
    >
        {children}
    </aside>
));
Sidebar.displayName = 'Sidebar';

export const SidebarHeader = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`p-4 border-b ${className}`} {...props}>
        {children}
    </div>
));
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`flex-1 overflow-y-auto p-4 ${className}`} {...props}>
        {children}
    </div>
));
SidebarContent.displayName = 'SidebarContent';

export const SidebarFooter = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`p-4 border-t ${className}`} {...props}>
        {children}
    </div>
));
SidebarFooter.displayName = 'SidebarFooter';

export const SidebarGroup = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`mb-4 ${className}`} {...props}>
        {children}
    </div>
));
SidebarGroup.displayName = 'SidebarGroup';

export const SidebarGroupLabel = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`text-xs font-semibold text-gray-500 uppercase mb-2 ${className}`} {...props}>
        {children}
    </div>
));
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export const SidebarGroupContent = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`space-y-1 ${className}`} {...props}>
        {children}
    </div>
));
SidebarGroupContent.displayName = 'SidebarGroupContent';

export const SidebarMenu = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <nav ref={ref} className={`space-y-1 ${className}`} {...props}>
        {children}
    </nav>
));
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`${className}`} {...props}>
        {children}
    </div>
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const SidebarMenuButton = React.forwardRef(({ className = '', children, isActive, ...props }, ref) => (
    <button
        ref={ref}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            } ${className}`}
        {...props}
    >
        {children}
    </button>
));
SidebarMenuButton.displayName = 'SidebarMenuButton';

export const SidebarTrigger = React.forwardRef(({ className = '', ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (
        <button
            ref={ref}
            onClick={toggleSidebar}
            className={`p-2 rounded-lg hover:bg-gray-100 ${className}`}
            {...props}
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
    );
});
SidebarTrigger.displayName = 'SidebarTrigger';

export const SidebarInset = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <main ref={ref} className={`flex-1 overflow-auto ${className}`} {...props}>
        {children}
    </main>
));
SidebarInset.displayName = 'SidebarInset';
