import { toast } from 'sonner';

export function useMediaUpload(
  fileInputRef: React.RefObject<HTMLInputElement | null>,
  formRef: React.RefObject<HTMLFormElement | null>,
  apiEndpoint: string,
  setPicture?: React.Dispatch<React.SetStateAction<string | null>>,
  successMessage?: string,
) {
  // Use the reference to the file picker input to open it when clicking on the upload button
  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleMediaUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    event.preventDefault();
    // Use formData to package the file to then be sent to the server
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    const uploadPromise = async () => {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message);
      }

      const data = await response.json();
      if (setPicture) {
        setPicture(data.fileUrl);
      }
    };

    toast.promise(uploadPromise(), {
      loading: 'Uploading...',
      success: () => {
        return successMessage;
      },
      error: (error) => error.message,
    });
  };

  return { handleFileInputClick, handleMediaUpload };
}
