import { SupplementData } from "@/schemas/supplement";
import SupplementCard from "@/components/SupplementCard";

interface SupplementListProps {
  supplements: SupplementData[];
  onEdit: (supplement: SupplementData) => void;
  onDelete: (id: string) => void;
  onTakeDose: (supplementId: string, timing: string) => Promise<void>;
  onIncreaseCount: (supplementId: string) => void;
  onDecreaseCount: (supplementId: string) => void;
  resolveGroupBadges: (
    supplement: SupplementData
  ) => {
    id: string;
    name: string;
  }[];
  onGroupBadgeClick: (groupId: string) => void;
  isGroupEditMode: boolean;
  isAssignedToTargetGroup: (supplement: SupplementData) => boolean;
  onToggleGroupMembership: (supplementId: string) => void;
  showFeedback: boolean;
  animatingIds: string[];
}

const SupplementList: React.FC<SupplementListProps> = ({
  supplements,
  onEdit,
  onDelete,
  onTakeDose,
  onIncreaseCount,
  onDecreaseCount,
  resolveGroupBadges,
  onGroupBadgeClick,
  isGroupEditMode,
  isAssignedToTargetGroup,
  onToggleGroupMembership,
  showFeedback,
  animatingIds,
}) => {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 justify-items-center"
      aria-label="サプリメント一覧"
    >
      {supplements.map((supplement) => (
        <SupplementCard
          key={supplement.id}
          supplement={supplement}
          onEdit={onEdit}
          onDelete={onDelete}
          onTakeDose={onTakeDose}
          onIncreaseCount={onIncreaseCount}
          onDecreaseCount={onDecreaseCount}
          groupBadges={resolveGroupBadges(supplement)}
          onGroupBadgeClick={onGroupBadgeClick}
          isGroupEditMode={isGroupEditMode}
          isAssignedToTargetGroup={isAssignedToTargetGroup(supplement)}
          onToggleGroupMembership={onToggleGroupMembership}
          showFeedback={showFeedback}
          animatingIds={animatingIds}
        />
      ))}
    </section>
  );
};

export default SupplementList;
