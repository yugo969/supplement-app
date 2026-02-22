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
  cardVariant?: "default" | "a";
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
  cardVariant = "default",
}) => {
  return (
    <section
      className="mx-auto grid w-full grid-cols-1 justify-center gap-y-3 gap-x-[clamp(8px,2.5vw,32px)] md:gap-y-4 md:[grid-template-columns:repeat(auto-fit,minmax(360px,390px))]"
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
          cardVariant={cardVariant}
        />
      ))}
    </section>
  );
};

export default SupplementList;
