import React from "react";
import Modal from "../../Modal";

interface SuccessPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Optional substring within `title` that should be rendered bold */
  boldPart?: string;
  /** When true show the animation video; when false show a checkmark image (inline SVG) */
  showVideo?: boolean;
  /** Optional image source for a checkmark/success image to show when `showVideo` is false */
  imageSrc?: string;
}

const SuccessPopupModal: React.FC<SuccessPopupModalProps> = ({
  isOpen,
  onClose,
  title,
  boldPart,
  showVideo = true,
  imageSrc,
}) => {
  const effectiveVideo = "/animations/tickmark-anim.mp4";

  // Split title into parts so `boldPart` (if provided and present) is bolded
  let titleBefore = title;
  let titleBold = "";
  let titleAfter = "";
  if (boldPart) {
    const idx = title.indexOf(boldPart);
    if (idx >= 0) {
      titleBefore = title.slice(0, idx);
      titleBold = title.slice(idx, idx + boldPart.length);
      titleAfter = title.slice(idx + boldPart.length);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      customWidth="w-[370px]"
      customeHeight="h-fit"
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      className="p-0"
      zIndexClass="z-[1000]"
    >
      <div className="flex flex-col items-center justify-center -mt-4 px-2 py-2">
        <div className="flex items-center gap-3">
          {showVideo ? (
            <video
              src={effectiveVideo}
              width={70}
              height={70}
              autoPlay
              loop
              muted
              playsInline
              onLoadedMetadata={(e) => {
                (e.currentTarget as HTMLVideoElement).playbackRate = 0.75;
              }}
              className="w-[3.5rem] h-[3.5rem]"
            />
          ) : imageSrc ? (
            <img
              src={imageSrc}
              alt="success"
              className="w-[2.5rem] h-[2.5rem] object-contain"
            />
          ) : null}
        </div>

        <div className="text-left ml-4 mt-6 text-[#414141] text-[14px] font-normal">
          {boldPart && titleBold ? (
            <>
              <span className="font-normal">{titleBefore}</span>
              <span className="font-semibold">{titleBold}</span>
              <span className="font-normal">{titleAfter}</span>
            </>
          ) : (
            <span className="font-normal">{title}</span>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SuccessPopupModal;
