import { TIMING_LABELS, TimingIconKey } from "@/components/timing-icons";
import { MdWbTwilight, MdLightMode, MdNightsStay } from "react-icons/md";
import { BsSunriseFill, BsSunFill, BsMoonStarsFill } from "react-icons/bs";

const DEMO_SUPPLEMENT_NAME = "ビタミンD";
const DEMO_REMAINING = 24;
const DEMO_DOSAGE = 2;
const DEMO_UNIT = "錠";

type Variant = "a" | "b" | "c";
type TimingIconSet = "new-icons" | "alt-icons";
type ComparisonScope = "all" | Variant;

const variants: Array<{
  id: Variant;
  label: string;
  mode: "timing" | "count";
  iconSet?: TimingIconSet;
}> = [
  { id: "a", label: "A案: 2行リスト型", mode: "timing", iconSet: "new-icons" },
  { id: "b", label: "B案: 1行2分割型", mode: "timing", iconSet: "alt-icons" },
  { id: "c", label: "C案: バッジ型", mode: "count" },
];

const ComparisonInfoBlock = ({ variant }: { variant: Variant }) => {
  if (variant === "a") {
    return (
      <div className="text-right text-xs">
        <p className="text-gray-500">在庫</p>
        <p className="text-base font-bold text-gray-800">
          {DEMO_REMAINING}
          <span className="ml-0.5 text-xs font-medium">{DEMO_UNIT}</span>
        </p>
        <p className="mt-0.5 text-gray-500">
          用量 {DEMO_DOSAGE}
          {DEMO_UNIT}
        </p>
      </div>
    );
  }

  if (variant === "b") {
    return (
      <div className="grid grid-cols-2 gap-2 rounded-md bg-white px-2 py-1 text-center text-xs">
        <div className="min-w-[52px]">
          <p className="text-[10px] text-gray-500">残数</p>
          <p className="text-sm font-semibold text-gray-800">
            {DEMO_REMAINING}
            {DEMO_UNIT}
          </p>
        </div>
        <div className="min-w-[52px]">
          <p className="text-[10px] text-gray-500">1回量</p>
          <p className="text-sm font-semibold text-gray-800">
            {DEMO_DOSAGE}
            {DEMO_UNIT}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 text-xs">
      <span className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-gray-700">
        在庫: {DEMO_REMAINING}
        {DEMO_UNIT}
      </span>
      <span className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-gray-700">
        用量: {DEMO_DOSAGE}
        {DEMO_UNIT}
      </span>
    </div>
  );
};

const NEW_TIMING_ICONS: Record<TimingIconKey, JSX.Element> = {
  morning: <BsSunriseFill size={20} />,
  noon: <BsSunFill size={20} />,
  night: <BsMoonStarsFill size={17} />,
};

const ALT_TIMING_ICONS: Record<TimingIconKey, JSX.Element> = {
  morning: <MdWbTwilight size={16} />,
  noon: <MdLightMode size={16} />,
  night: <MdNightsStay size={16} />,
};

const DemoTimingButtons = ({ iconSet }: { iconSet: TimingIconSet }) => (
  <div className="flex items-center gap-1.5">
    {(["morning", "noon", "night"] as TimingIconKey[]).map((timing) => (
      <span
        key={timing}
        title={TIMING_LABELS[timing]}
        aria-label={TIMING_LABELS[timing]}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-[0_4px_10px_rgba(15,23,42,0.18)] transition-all hover:translate-y-[1px] hover:shadow-[0_2px_6px_rgba(15,23,42,0.16)]"
      >
        <span
          className={iconSet === "new-icons" ? "scale-[1.05]" : "scale-[1.02]"}
        >
          {iconSet === "new-icons"
            ? NEW_TIMING_ICONS[timing]
            : ALT_TIMING_ICONS[timing]}
        </span>
      </span>
    ))}
  </div>
);

const DemoGroupBadges = () => (
  <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
    <span className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-700">
      朝セット
    </span>
    <span className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-700">
      免疫
    </span>
  </div>
);

const DemoCountButtons = () => (
  <div className="flex h-9 items-center rounded-full border border-gray-300 bg-white text-sm text-gray-700 shadow-[0_4px_10px_rgba(15,23,42,0.12)]">
    <span className="flex h-9 w-9 items-center justify-center border-r border-gray-300">
      -
    </span>
    <span className="flex items-center gap-1 px-2.5">
      <span className="h-2 w-2 rounded-full bg-gray-500" />
      <span className="h-2 w-2 rounded-full bg-gray-500" />
    </span>
    <span className="flex h-9 w-9 items-center justify-center border-l border-gray-300">
      +
    </span>
  </div>
);

const SupplementInfoDensityComparison = ({
  scope = "all",
}: {
  scope?: ComparisonScope;
}) => {
  const scopedVariants =
    scope === "all"
      ? variants
      : variants.filter((variant) => variant.id === scope);

  return (
    <section className="mt-3 flex flex-col gap-2 rounded-lg border border-dashed border-gray-300 bg-white/70 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          比較用ダミーカード
        </h3>
        <span className="text-[11px] text-gray-500">非操作</span>
      </div>

      <div className="flex flex-col gap-3">
        {scopedVariants.map((variant) => (
          <div key={variant.id} className="w-full max-w-[390px] mx-auto">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-gray-600">
              <span className="font-medium text-gray-700">
                {variant.id.toUpperCase()}案
              </span>
              <span>{variant.label.replace(/^[A-C]案:\s*/, "")}</span>
            </div>

            <article
              className="relative rounded-xl border border-gray-200 bg-zinc-50 shadow-sm shadow-slate-300"
              aria-label={variant.label}
            >
              <div className="relative flex min-h-[176px] items-stretch">
                <div className="w-28 shrink-0 bg-gradient-to-br from-gray-300 to-gray-400 text-xs text-gray-600 flex items-center justify-center">
                  image
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {DEMO_SUPPLEMENT_NAME}
                      </p>
                    </div>
                    <ComparisonInfoBlock variant={variant.id} />
                  </div>

                  <DemoGroupBadges />

                  {variant.mode === "timing" ? (
                    <DemoTimingButtons
                      iconSet={variant.iconSet ?? "new-icons"}
                    />
                  ) : (
                    <DemoCountButtons />
                  )}

                  <div className="mt-auto grid w-full grid-cols-[1fr_auto] items-center gap-1 pt-2 min-h-7">
                    <div className="justify-self-center text-xs text-gray-600 underline underline-offset-2">
                      服用方法
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="rounded border border-gray-300 px-2 py-0.5 text-gray-700">
                        編集
                      </span>
                      <span className="rounded px-2 py-0.5 text-gray-700">
                        削除
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SupplementInfoDensityComparison;
