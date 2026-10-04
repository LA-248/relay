export default function handleModalOutsideClick(
  modalRef: React.RefObject<HTMLElement | null>,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  isModalOpen: boolean,
) {
  const handleOutsideClick = (event: MouseEvent) => {
    if (
      modalRef.current &&
      event.target instanceof Node &&
      !modalRef.current.contains(event.target)
    ) {
      setIsModalOpen(false);
    }
  };

  if (isModalOpen) {
    document.addEventListener('mousedown', handleOutsideClick);
  }

  return () => {
    document.removeEventListener('mousedown', handleOutsideClick);
  };
}
