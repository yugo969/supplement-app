import { SupplementData } from "@/schemas/supplement";
import SupplementCard from "@/components/SupplementCard";

interface SupplementListProps {
  supplements: SupplementData[];
  onEdit: (supplement: SupplementData) => void;
  onDelete: (id: string) => void;
  onTakeDose: (supplementId: string, timing: string) => Promise<void>;
  onIncreaseCount: (supplementId: string) => void;
  onDecreaseCount: (supplementId: string) => void;
  resolveGroupBadges: (supplement: SupplementData) => {
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
      className="flex flex-col gap-3 md:gap-4"
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
