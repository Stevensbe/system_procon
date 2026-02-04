import React, { createContext, useContext, useState } from 'react';

const DropdownMenuContext = createContext({
    isOpen: false,
    setIsOpen: () => { },
});

export const DropdownMenu = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
            <div className="relative inline-block text-left">
                {children}
            </div>
        </DropdownMenuContext.Provider>
    );
};

export const DropdownMenuTrigger = React.forwardRef(({ className = '', children, asChild, ...props }, ref) => {
    const { isOpen, setIsOpen } = useContext(DropdownMenuContext);

    const handleClick = () => setIsOpen(!isOpen);

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            ref,
            onClick: handleClick,
            ...props,
        });
    }

    return (
        <button
            ref={ref}
            onClick={handleClick}
            className={className}
            {...props}
        >
            {children}
        </button>
    );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuContent = React.forwardRef(({ className = '', children, align = 'end', ...props }, ref) => {
    const { isOpen, setIsOpen } = useContext(DropdownMenuContext);

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
            />
            <div
                ref={ref}
                className={`absolute z-50 mt-2 min-w-[180px] overflow-hidden rounded-md border bg-white p-1 shadow-lg ${align === 'end' ? 'right-0' : 'left-0'
                    } ${className}`}
                {...props}
            >
                {children}
            </div>
        </>
    );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef(({ className = '', children, ...props }, ref) => {
    const { setIsOpen } = useContext(DropdownMenuContext);

    return (
        <button
            ref={ref}
            className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 ${className}`}
            onClick={() => setIsOpen(false)}
            {...props}
        >
            {children}
        </button>
    );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuLabel = React.forwardRef(({ className = '', children, ...props }, ref) => (
    <div
        ref={ref}
        className={`px-2 py-1.5 text-sm font-semibold ${className}`}
        {...props}
    >
        {children}
    </div>
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = React.forwardRef(({ className = '', ...props }, ref) => (
    <div
        ref={ref}
        className={`-mx-1 my-1 h-px bg-gray-200 ${className}`}
        {...props}
    />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';
