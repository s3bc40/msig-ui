import React from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  boxClassName?: string;
  showCloseButton?: boolean;
  closeLabel?: string;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  className = "modal modal-bottom sm:modal-middle",
  boxClassName = "modal-box flex flex-col gap-6 p-8",
  showCloseButton = true,
  closeLabel = "Close",
}) => {
  if (!open) return null;
  return (
    <dialog className={className} open>
      <div className={boxClassName}>
        {children}
        {showCloseButton && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              {closeLabel}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};

export { Modal };
