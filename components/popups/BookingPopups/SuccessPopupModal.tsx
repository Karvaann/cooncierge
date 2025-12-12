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
      customWidth="w-[26vw]"
      customeHeight="h-[19vh]"
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      className="p-0"
      zIndexClass="z-[1000]"
    >
      <div className="flex flex-col items-center justify-center -mt-4 px-2">
        <video
          src="/animations/tickmark-anim.mp4"
          width="70"
          height="70"
          autoPlay
          loop
          muted
          playsInline
          onLoadedMetadata={(e) => {
            (e.currentTarget as HTMLVideoElement).playbackRate = 0.75;
          }}
          className="w-[3.5rem] h-[3.5rem]"
        />

        <div className="text-center mt-2 text-[#1A7F64] text-[0.75rem] font-semibold">
          {title}
        </div>
      </div>
    </Modal>
  );
};

export default SuccessPopupModal;
