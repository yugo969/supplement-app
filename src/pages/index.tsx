import firebase from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SupplementData,
  DosageMethod,
  supplementFormSchema,
  SupplementFormData,
} from "@/schemas/supplement";
import SupplementForm from "@/components/SupplementForm";
import { useSupplementOperations } from "@/hooks/useSupplementOperations";
import { useNotificationHandling } from "@/hooks/useNotificationHandling";
import { useDataManagement } from "@/hooks/useDataManagement";
import { useScrollManagement } from "@/hooks/useScrollManagement";
import HeaderSection from "@/components/HeaderSection";
import SupplementList from "@/components/SupplementList";
import LoadingState from "@/components/LoadingState";
import FloatingAddButton from "@/components/FloatingAddButton";
import AnimatedFeedback from "@/components/AnimatedFeedback";

const maxWidth = 552;
const maxHeight = 366;

export default function Home() {
  const methods = useForm<SupplementFormData>({
    resolver: zodResolver(supplementFormSchema) as any,
    defaultValues: {
      supplement_name: "",
      dosage: 1,
      dosage_unit: "錠",
      intake_amount: 1,
      intake_unit: "錠",
      dosage_method: "timing",
      timing_morning: false,
      timing_noon: false,
      timing_night: false,
      timing_before_meal: false,
      timing_after_meal: false,
      timing_empty_stomach: false,
      timing_bedtime: false,
      daily_target_count: 1,
      meal_timing: "none",
    },
  });
  const { setValue } = methods;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplements, setSupplements] = useState<SupplementData[]>([]);
  const [selectedSupplement, setSelectedSupplement] =
    useState<null | SupplementData>(null);

  // 単位の同期処理のための状態
  const [selectedUnit, setSelectedUnit] = useState<string>("錠");

  const [selectedDosageMethod, setSelectedDosageMethod] =
    useState<DosageMethod>("timing");

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showInfoDetails, setShowInfoDetails] = useState(false);

  const { user, loading } = useAuth();

  // データ管理（日付変更監視とデータ取得・リセット）
  useDataManagement({ user, setSupplements });

  // useNotificationHandlingカスタムフック
  const {
    showFeedback,
    feedbackTimingId,
    animatingIds,
    setShowFeedback,
    setFeedbackTimingId,
    setAnimatingIds,
    handleTakeDose,
    handleFeedbackComplete,
  } = useNotificationHandling({
    supplements,
    setSupplements,
  });

  // useSupplementOperationsカスタムフック
  const {
    resetForm,
    handleAddOrUpdateSupplement,
    handleOpenUpdateModal,
    handleDeleteSupplement,
    handleImageChange,
    handleImageDelete,
    handleUnitChange,
    handleIncreaseDosageCount,
    handleDecreaseDosageCount,
  } = useSupplementOperations({
    supplements,
    setSupplements,
    setIsModalOpen,
    selectedSupplement,
    setSelectedSupplement,
    setUploadedImage,
    setSelectedUnit,
    setSelectedDosageMethod,
    setShowInfoDetails,
    setShowFeedback,
    setFeedbackTimingId,
    setAnimatingIds,
    showFeedback,
    animatingIds,
    uploadedImage,
    methods,
  });

  // スクロール管理（服用回数履歴の自動スクロール）
  useScrollManagement({
    supplements,
  });

  const handleLogout = async () => {
    await firebase.auth().signOut();
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div
      className={`relative min-h-screen bg-zinc-200 ${
        isModalOpen && "overflow-hidden"
      }`}
    >
      <main className="relative">
        <FloatingAddButton onClick={handleOpenModal} />

        <div className="relative flex flex-col w-screen h-full md:p-10 p-4 gap-6">
          <HeaderSection
            onAddSupplement={handleOpenModal}
            onLogout={handleLogout}
          />

          <SupplementList
            supplements={supplements}
            onEdit={handleOpenUpdateModal}
            onDelete={handleDeleteSupplement}
            onTakeDose={handleTakeDose}
            onIncreaseCount={handleIncreaseDosageCount}
            onDecreaseCount={handleDecreaseDosageCount}
            showFeedback={showFeedback}
            animatingIds={animatingIds}
          />
        </div>
      </main>

      {isModalOpen && (
        <SupplementForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSupplement(null);
            setUploadedImage(null);
            resetForm();
            setShowInfoDetails(false);
          }}
          methods={methods}
          selectedSupplement={selectedSupplement}
          uploadedImage={uploadedImage}
          selectedUnit={selectedUnit}
          selectedDosageMethod={selectedDosageMethod}
          showInfoDetails={showInfoDetails}
          onSubmit={handleAddOrUpdateSupplement}
          onImageChange={handleImageChange}
          onImageDelete={handleImageDelete}
          onUnitChange={handleUnitChange}
          onDosageMethodChange={(method: DosageMethod) => {
            setSelectedDosageMethod(method);
            setValue("dosage_method", method);
          }}
          onToggleInfoDetails={() => setShowInfoDetails(!showInfoDetails)}
        />
      )}

      <AnimatedFeedback
        isVisible={showFeedback}
        timingId={feedbackTimingId}
        onAnimationComplete={handleFeedbackComplete}
      />
    </div>
  );
}
