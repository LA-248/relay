import { type ReactNode, useEffect, useRef } from 'react';
import handleModalOutsideClick from '../utils/ModalOutsideClick';
import useClearErrorMessage from '../hooks/useClearErrorMessage';

interface ModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  children: ReactNode;
}

export default function Modal({
  isModalOpen,
  setIsModalOpen,
  errorMessage,
  setErrorMessage,
  children,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    handleModalOutsideClick(modalRef, setIsModalOpen, isModalOpen);
  }, [setIsModalOpen, isModalOpen]);

  useClearErrorMessage(errorMessage, setErrorMessage);

  if (!isModalOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        {children}

        {errorMessage ? (
          <div className="error-message">{errorMessage}</div>
        ) : null}
      </div>
    </div>
  );
}
