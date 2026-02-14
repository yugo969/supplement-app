import firebase from "@/lib/firebaseClient";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SupplementData,
  DosageMethod,
  supplementFormSchema,
  SupplementFormData,
  SupplementGroup,
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
import EmptyStateCard from "@/components/EmptyStateCard";
import {
  addSupplementGroup,
  deleteSupplementGroup,
  getSupplementGroups,
  toggleSupplementGroupMembership,
} from "@/lib/firestore";
import { useNotification } from "@/lib/useNotification";

const SYSTEM_GROUPS: SupplementGroup[] = [
  { id: "system-morning", name: "朝", isSystem: true },
  { id: "system-noon", name: "昼", isSystem: true },
  { id: "system-night", name: "夜", isSystem: true },
];
const UNGROUPED_GROUP_ID = "ungrouped";
const GROUP_NAME_MAX_LENGTH = 12;

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
  const [customGroups, setCustomGroups] = useState<SupplementGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isGroupEditMode, setIsGroupEditMode] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const groupChipContainerRef = useRef<HTMLDivElement | null>(null);
  const groupChipButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [canScrollGroupLeft, setCanScrollGroupLeft] = useState(false);
  const [canScrollGroupRight, setCanScrollGroupRight] = useState(false);
  const { showNotification } = useNotification();

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
    handleImageUpdate,
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
    selectedGroupIds,
    setSelectedGroupIds,
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

  useEffect(() => {
    if (!user) {
      setCustomGroups([]);
      return;
    }

    getSupplementGroups().then((groups) => {
      setCustomGroups(groups);
    });
  }, [user]);

  const groupMap = useMemo(() => {
    const map = new Map<string, SupplementGroup>();
    [...SYSTEM_GROUPS, ...customGroups].forEach((group) => {
      map.set(group.id, group);
    });
    return map;
  }, [customGroups]);

  const getSystemGroupIdsForSupplement = useCallback(
    (supplement: SupplementData) => {
      const ids: string[] = [];
      if (supplement.timing_morning) ids.push("system-morning");
      if (supplement.timing_noon) ids.push("system-noon");
      if (supplement.timing_night) ids.push("system-night");
      return ids;
    },
    []
  );

  const isUngroupedSupplement = useCallback(
    (supplement: SupplementData) => {
      return (supplement.groupIds || []).length === 0;
    },
    []
  );

  const hasUngroupedSupplements = useMemo(
    () => supplements.some(isUngroupedSupplement),
    [supplements, isUngroupedSupplement]
  );

  const filteredSupplements = useMemo(() => {
    if (isGroupEditMode || !activeGroupId) {
      return supplements;
    }
    if (activeGroupId === UNGROUPED_GROUP_ID) {
      return supplements.filter(isUngroupedSupplement);
    }
    if (activeGroupId === "system-morning") {
      return supplements.filter((supplement) => supplement.timing_morning);
    }
    if (activeGroupId === "system-noon") {
      return supplements.filter((supplement) => supplement.timing_noon);
    }
    if (activeGroupId === "system-night") {
      return supplements.filter((supplement) => supplement.timing_night);
    }
    return supplements.filter((supplement) =>
      (supplement.groupIds || []).includes(activeGroupId)
    );
  }, [supplements, activeGroupId, isGroupEditMode, isUngroupedSupplement]);

  const groupChips = useMemo(() => {
    if (isGroupEditMode) {
      return customGroups;
    }

    const chips: SupplementGroup[] = [...SYSTEM_GROUPS, ...customGroups];
    if (hasUngroupedSupplements) {
      chips.unshift({ id: UNGROUPED_GROUP_ID, name: "未設定", isSystem: true });
    }
    return chips;
  }, [customGroups, hasUngroupedSupplements, isGroupEditMode]);

  const resolveGroupBadges = (supplement: SupplementData) =>
    (supplement.groupIds || [])
      .map((groupId) => groupMap.get(groupId))
      .filter((group): group is SupplementGroup => !!group)
      .map((group) => ({ id: group.id, name: group.name }));

  const isAssignedToTargetGroup = (supplement: SupplementData) =>
    !!activeGroupId &&
    activeGroupId !== UNGROUPED_GROUP_ID &&
    !activeGroupId.startsWith("system-") &&
    (supplement.groupIds || []).includes(activeGroupId);

  const showEmptyGroupDeleteConfirmation = (targetGroupId: string) => {
    const targetGroup = customGroups.find((group) => group.id === targetGroupId);
    if (!targetGroup) {
      setIsGroupEditMode(false);
      return;
    }

    showNotification({
      message: `${targetGroup.name}にサプリがありません。グループを削除しますか？`,
      autoHide: false,
      actions: [
        {
          label: "キャンセル",
          callback: () => {
            setIsGroupEditMode(false);
            showNotification({
              message: "グループを残しました",
              duration: 1000,
            });
          },
        },
        {
          label: "削除",
          callback: async () => {
            try {
              await deleteSupplementGroup(targetGroupId);
              setCustomGroups((prev) =>
                prev.filter((group) => group.id !== targetGroupId)
              );
              setSupplements((prev) =>
                prev.map((supplement) => ({
                  ...supplement,
                  groupIds: (supplement.groupIds || []).filter(
                    (groupId) => groupId !== targetGroupId
                  ),
                }))
              );
              setActiveGroupId((prev) => (prev === targetGroupId ? null : prev));
              setIsGroupEditMode(false);
              showNotification({ message: "グループを削除しました" });
            } catch (error) {
              showNotification({ message: "グループ削除に失敗しました" });
            }
          },
        },
      ],
    });
  };

  const handleToggleGroupEditMode = () => {
    if (!isGroupEditMode && customGroups.length === 0) {
      showNotification({ message: "先にグループを追加してください" });
      return;
    }

    if (
      isGroupEditMode &&
      activeGroupId &&
      activeGroupId !== UNGROUPED_GROUP_ID &&
      !activeGroupId.startsWith("system-")
    ) {
      const isGroupEmpty = !supplements.some((supplement) =>
        (supplement.groupIds || []).includes(activeGroupId)
      );
      if (isGroupEmpty) {
        showEmptyGroupDeleteConfirmation(activeGroupId);
        return;
      }
    }

    setIsGroupEditMode((prev) => {
      const next = !prev;
      if (
        next &&
        (!activeGroupId ||
          activeGroupId === UNGROUPED_GROUP_ID ||
          activeGroupId.startsWith("system-"))
      ) {
        setActiveGroupId(customGroups[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleSelectGroupChip = (groupId: string) => {
    setActiveGroupId(groupId);
  };

  const updateGroupChipScrollState = useCallback(() => {
    const container = groupChipContainerRef.current;
    if (!container) {
      setCanScrollGroupLeft(false);
      setCanScrollGroupRight(false);
      return;
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    setCanScrollGroupLeft(container.scrollLeft > 0);
    setCanScrollGroupRight(maxScrollLeft - container.scrollLeft > 2);
  }, []);

  useEffect(() => {
    const container = groupChipContainerRef.current;
    if (!container) return;

    const handleScroll = () => updateGroupChipScrollState();
    const handleResize = () => updateGroupChipScrollState();

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    updateGroupChipScrollState();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [groupChips, updateGroupChipScrollState]);

  useEffect(() => {
    if (!activeGroupId) return;

    const container = groupChipContainerRef.current;
    const chip = groupChipButtonRefs.current.get(activeGroupId);
    if (!container || !chip) return;

    const containerRect = container.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const padding = 8;

    if (chipRect.right > containerRect.right) {
      container.scrollLeft += chipRect.right - containerRect.right + padding;
    } else if (chipRect.left < containerRect.left) {
      container.scrollLeft -= containerRect.left - chipRect.left + padding;
    }
    updateGroupChipScrollState();
  }, [activeGroupId, isGroupEditMode, updateGroupChipScrollState]);

  const handleToggleGroupMembership = async (supplementId: string) => {
    if (
      !isGroupEditMode ||
      !activeGroupId ||
      activeGroupId === UNGROUPED_GROUP_ID ||
      activeGroupId.startsWith("system-")
    ) {
      return;
    }

    const targetSupplement = supplements.find(
      (supplement) => supplement.id === supplementId
    );
    if (!targetSupplement) return;

    const currentlyAssigned = (targetSupplement.groupIds || []).includes(
      activeGroupId
    );
    const nextAssigned = !currentlyAssigned;
    const targetGroupId = activeGroupId;

    const nextSupplements = supplements.map((supplement) => {
      if (supplement.id !== supplementId) return supplement;
      const nextGroupIds = nextAssigned
        ? Array.from(new Set([...(supplement.groupIds || []), targetGroupId]))
        : (supplement.groupIds || []).filter((id) => id !== targetGroupId);
      return { ...supplement, groupIds: nextGroupIds };
    });

    setSupplements(nextSupplements);

    try {
      await toggleSupplementGroupMembership(
        supplementId,
        targetGroupId,
        nextAssigned
      );
    } catch (error) {
      setSupplements((prev) =>
        prev.map((supplement) => {
          if (supplement.id !== supplementId) return supplement;
          return {
            ...supplement,
            groupIds: currentlyAssigned
              ? Array.from(
                  new Set([...(supplement.groupIds || []), targetGroupId])
                )
              : (supplement.groupIds || []).filter((id) => id !== targetGroupId),
          };
        })
      );
      showNotification({
        message: "グループ更新に失敗しました",
      });
    }
  };

  const handleAddGroupFromForm = async (rawName: string): Promise<boolean> => {
    const name = rawName.trim();
    if (!name) return false;
    if (Array.from(name).length > GROUP_NAME_MAX_LENGTH) {
      showNotification({
        message: `グループ名は${GROUP_NAME_MAX_LENGTH}文字以内で入力してください`,
      });
      return false;
    }

    const existingGroup = customGroups.find(
      (group) => group.name.toLowerCase() === name.toLowerCase()
    );
    if (existingGroup) {
      setSelectedGroupIds((prev) =>
        prev.includes(existingGroup.id) ? prev : [...prev, existingGroup.id]
      );
      showNotification({
        message: "同名のグループがあるため既存グループを選択しました",
      });
      return true;
    }

    try {
      const newGroupId = await addSupplementGroup(name);
      setCustomGroups((prev) => [...prev, { id: newGroupId, name }]);
      setSelectedGroupIds((prev) => Array.from(new Set([...prev, newGroupId])));
      showNotification({ message: "グループを追加しました" });
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "グループの追加に失敗しました";
      showNotification({ message });
      return false;
    }
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

          <section
            className={`rounded-md p-3 md:p-4 transition-colors ${
              isGroupEditMode ? "bg-gray-300/70" : "bg-white/50"
            }`}
            aria-label="グループ操作"
          >
            <div className="flex items-start gap-2">
              <div className="relative flex-1 min-w-0">
                {canScrollGroupLeft && (
                  <button
                    type="button"
                    onClick={() =>
                      groupChipContainerRef.current?.scrollBy({
                        left: -160,
                        behavior: "smooth",
                      })
                    }
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full border border-gray-300 bg-white/95 text-gray-700 shadow-sm flex items-center justify-center"
                    aria-label="左にスクロール"
                  >
                    <MdChevronLeft size={18} />
                  </button>
                )}
                <div
                  ref={groupChipContainerRef}
                  className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {groupChips.map((group) => {
                    const isActive = activeGroupId === group.id;
                    return (
                      <button
                        key={group.id}
                        ref={(el) => {
                          if (el) {
                            groupChipButtonRefs.current.set(group.id, el);
                          } else {
                            groupChipButtonRefs.current.delete(group.id);
                          }
                        }}
                        type="button"
                        onClick={() => handleSelectGroupChip(group.id)}
                        className={`flex-none whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          isActive
                            ? "bg-gray-700 text-white border-gray-700"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                        aria-pressed={isActive}
                      >
                        {group.name}
                      </button>
                    );
                  })}
                  {isGroupEditMode && groupChips.length === 0 && (
                    <p className="text-sm text-gray-600">
                      編集対象のグループがありません。先に「グループ追加」を実行してください。
                    </p>
                  )}
                </div>
                {canScrollGroupRight && (
                  <button
                    type="button"
                    onClick={() =>
                      groupChipContainerRef.current?.scrollBy({
                        left: 160,
                        behavior: "smooth",
                      })
                    }
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full border border-gray-300 bg-white/95 text-gray-700 shadow-sm flex items-center justify-center"
                    aria-label="右にスクロール"
                  >
                    <MdChevronRight size={18} />
                  </button>
                )}
              </div>
              {(isGroupEditMode || !!activeGroupId) && (
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-md text-sm font-medium border ${
                      isGroupEditMode
                        ? "bg-gray-700 text-white border-gray-700"
                        : "bg-white text-gray-700 border-gray-400"
                    }`}
                    onClick={handleToggleGroupEditMode}
                  >
                    {isGroupEditMode ? "登録" : "編集"}
                  </button>
                  {!!activeGroupId && (
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md text-sm font-medium border bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      onClick={() => {
                        setActiveGroupId(null);
                        setIsGroupEditMode(false);
                      }}
                    >
                      解除
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {supplements.length === 0 ? (
            <EmptyStateCard onAddSupplement={handleOpenModal} />
          ) : (
            <SupplementList
              supplements={filteredSupplements}
              onEdit={handleOpenUpdateModal}
              onDelete={handleDeleteSupplement}
              onTakeDose={handleTakeDose}
              onIncreaseCount={handleIncreaseDosageCount}
              onDecreaseCount={handleDecreaseDosageCount}
              resolveGroupBadges={resolveGroupBadges}
              onGroupBadgeClick={setActiveGroupId}
              isGroupEditMode={isGroupEditMode}
              isAssignedToTargetGroup={isAssignedToTargetGroup}
              onToggleGroupMembership={handleToggleGroupMembership}
              showFeedback={showFeedback}
              animatingIds={animatingIds}
            />
          )}
        </div>
      </main>

      {isModalOpen && (
        <SupplementForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSupplement(null);
            setUploadedImage(null);
            setSelectedGroupIds([]);
            resetForm();
            setShowInfoDetails(false);
          }}
          methods={methods}
          selectedSupplement={selectedSupplement}
          uploadedImage={uploadedImage}
          selectedUnit={selectedUnit}
          selectedDosageMethod={selectedDosageMethod}
          showInfoDetails={showInfoDetails}
          availableGroups={customGroups}
          selectedGroupIds={selectedGroupIds}
          onSelectGroup={(groupId) =>
            setSelectedGroupIds((prev) =>
              prev.includes(groupId) ? prev : [...prev, groupId]
            )
          }
          onRemoveGroup={(groupId) =>
            setSelectedGroupIds((prev) => prev.filter((id) => id !== groupId))
          }
          onCreateGroup={handleAddGroupFromForm}
          onSubmit={handleAddOrUpdateSupplement}
          onImageChange={handleImageChange}
          onImageDelete={handleImageDelete}
          onImageUpdate={handleImageUpdate}
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
