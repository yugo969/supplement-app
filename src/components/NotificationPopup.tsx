import React from "react";
import { useNotification } from "@/lib/useNotification";
import { Button } from "@/components/ui/button";

const NotificationPopup = () => {
  const { isVisible, notificationProps } = useNotification();
  if (!isVisible || !notificationProps) return null;

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 overflow-hidden overscroll-none flex justify-center items-center w-screen h-screen bg-black/60 z-50">
      <div className="flex flex-col justify-center items-center gap-4 w-fit max-w-[90vw] h-fit rounded-lg py-6 px-8 md:py-10 md:px-16 bg-white/90 text-black shadow-lg border border-gray-200">
        <p className="text-center text-base md:text-lg font-medium">
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
