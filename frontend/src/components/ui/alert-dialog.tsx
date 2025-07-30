import React, { createContext, useContext, useState } from 'react';

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ children, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

interface AlertDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export const AlertDialogTrigger: React.FC<AlertDialogTriggerProps> = ({ 
  children, 
  asChild = false, 
  className = ""
}) => {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error('AlertDialogTrigger must be used within AlertDialog');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    context.setOpen(true);
  };

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as any;
    return React.cloneElement(children as React.ReactElement<any>, {
      ...childProps,
      onClick: (e: React.MouseEvent) => {
        if (childProps.onClick) {
          childProps.onClick(e);
        }
        handleClick(e);
      },
      className: `${childProps.className || ''} ${className || ''}`.trim()
    });
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};

interface AlertDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDialogContent: React.FC<AlertDialogContentProps> = ({ 
  children, 
  className = "" 
}) => {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error('AlertDialogContent must be used within AlertDialog');

  if (!context.open) return null;

  return (
    <div 
      className="modal d-block" 
      style={{ 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        backdropFilter: 'blur(8px)',
        zIndex: 1055
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className={`modal-content border-0 shadow-lg ${className}`} 
             style={{ 
               borderRadius: '16px',
               overflow: 'hidden',
               boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
             }}>
          {children}
        </div>
      </div>
    </div>
  );
};

interface AlertDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`modal-header border-0 pb-3 pt-4 px-4 ${className}`} 
         style={{ 
           background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
           borderTopLeftRadius: '16px',
           borderTopRightRadius: '16px'
         }}>
      {children}
    </div>
  );
};

interface AlertDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <h4 className={`modal-title fw-bold mb-1 ${className}`} 
        style={{ color: '#2d3748', fontSize: '1.5rem' }}>
      {children}
    </h4>
  );
};

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`modal-body py-4 px-4 ${className}`} 
         style={{ backgroundColor: '#ffffff' }}>
      {children}
    </div>
  );
};

interface AlertDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`modal-footer border-0 pt-0 pb-4 px-4 gap-3 ${className}`} 
         style={{ 
           backgroundColor: '#f8f9fa',
           borderBottomLeftRadius: '16px',
           borderBottomRightRadius: '16px'
         }}>
      {children}
    </div>
  );
};

interface AlertDialogCancelProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({ 
  children, 
  className,
  onClick 
}) => {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error('AlertDialogCancel must be used within AlertDialog');

  const defaultClassName = "btn btn-light border fw-medium px-4 py-2";
  const finalClassName = className || defaultClassName;

  const handleClick = () => {
    context.setOpen(false);
    onClick?.();
  };

  return (
    <button onClick={handleClick} 
            className={finalClassName}
            style={{
              borderRadius: '8px',
              color: '#6c757d',
              borderColor: '#dee2e6',
              transition: 'all 0.2s ease'
            }}>
      {children}
    </button>
  );
};

interface AlertDialogActionProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'danger' | 'primary' | 'warning' | 'success';
}

export const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ 
  children, 
  className,
  onClick,
  variant = 'primary'
}) => {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error('AlertDialogAction must be used within AlertDialog');

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          className: "btn fw-medium px-4 py-2",
          style: {
            backgroundColor: '#dc3545',
            borderColor: '#dc3545',
            color: 'white',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)'
          }
        };
      case 'warning':
        return {
          className: "btn fw-medium px-4 py-2",
          style: {
            backgroundColor: '#fd7e14',
            borderColor: '#fd7e14',
            color: 'white',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(253, 126, 20, 0.3)'
          }
        };
      case 'success':
        return {
          className: "btn fw-medium px-4 py-2",
          style: {
            backgroundColor: '#198754',
            borderColor: '#198754',
            color: 'white',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(25, 135, 84, 0.3)'
          }
        };
      default:
        return {
          className: "btn fw-medium px-4 py-2",
          style: {
            backgroundColor: '#0d6efd',
            borderColor: '#0d6efd',
            color: 'white',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(13, 110, 253, 0.3)'
          }
        };
    }
  };

  const variantStyles = getVariantStyles();
  const finalClassName = className || variantStyles.className;

  const handleClick = () => {
    onClick?.();
    // Don't auto-close for dangerous actions - let the parent handle it
    if (variant !== 'danger') {
      context.setOpen(false);
    }
  };

  return (
    <button onClick={handleClick} 
            className={finalClassName}
            style={variantStyles.style}>
      {children}
    </button>
  );
};
