import React, { useEffect, useRef } from "react";
import { useNotification } from "@/lib/useNotification";
import { Button } from "@/components/ui/button";
import { MdClose } from "react-icons/md";

const NotificationPopup = () => {
  const { isVisible, notificationProps, hideNotification } = useNotification();
  const popupRef = useRef<HTMLDivElement>(null);

  // ポップアップが表示されたら、フォーカスを移動
  useEffect(() => {
    if (isVisible && popupRef.current) {
      popupRef.current.focus();
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideNotification();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isVisible, hideNotification]);

  if (!isVisible || !notificationProps) return null;

  return (
    <div
      className="fixed top-0 bottom-0 left-0 right-0 overflow-hidden overscroll-none flex justify-center items-center w-screen h-screen bg-black/60 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-message"
      onClick={hideNotification}
    >
      <div
        ref={popupRef}
        className="relative flex flex-col justify-center items-center gap-4 w-fit max-w-[90vw] h-fit rounded-lg py-6 px-8 md:py-10 md:px-16 bg-white/90 text-black shadow-lg border border-gray-200"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={hideNotification}
          className="absolute top-2 right-2 rounded-full p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          aria-label="通知を閉じる"
        >
          <MdClose size={18} aria-hidden="true" />
        </button>
        <p
          id="notification-message"
          className="text-center text-base md:text-lg font-medium"
        >
          {notificationProps.message}
        </p>

        {notificationProps.actions && (
          <div className="flex flex-wrap justify-center mt-4 gap-2">
            {notificationProps.actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="border-gray-400 hover:bg-gray-100 text-black"
                onClick={action.callback}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPopup;
