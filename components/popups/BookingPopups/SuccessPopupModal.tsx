import React from "react";
import Modal from "../../Modal";

interface SuccessPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const SuccessPopupModal: React.FC<SuccessPopupModalProps> = ({
  isOpen,
  onClose,
  title,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      customWidth="w-[500px]"
      customeHeight="h-[250px]"
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      className="p-0"
    >
      <div className="flex flex-col items-center justify-center -mt-8 px-3">
        <video
          src="/animations/tickmark-anim.mp4"
          width="100"
          height="100"
          autoPlay
          loop
          muted
          playsInline
          onLoadedMetadata={(e) => {
            (e.currentTarget as HTMLVideoElement).playbackRate = 0.75;
          }}
        />

        <div className="text-center mb-2 mt-2 text-[#1A7F64] text-lg font-semibold">
          {title}
        </div>
      </div>
    </Modal>
  );
};

export default SuccessPopupModal;
