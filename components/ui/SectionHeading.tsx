import Link from "next/link";

interface Props {
    label: string;
    href?: string;
    seeAllLabel?: string;
    color?: string;
    invert?: boolean; // white text for dark backgrounds
    icon?: React.ReactNode;
}

export default function SectionHeading({
    label,
    href,
    seeAllLabel = "See All",
    color,
    invert = false,
    icon,
}: Props) {
    const accentColor = color ?? "var(--g-color)";
    const textColor = invert ? "#fff" : "var(--heading-color)";
    const metaColor = invert ? "rgba(255,255,255,0.5)" : "var(--meta-fcolor)";

    return (
        <div
            className="section-heading"
            style={
                color
                    ? ({ "--g-color": color } as React.CSSProperties)
                    : {}
            }
        >
            <div className="flex items-center gap-2">
                <span
                    className="section-heading-label"
                    style={{ color: invert ? "#fff" : undefined }}
                >
                    {label}
                </span>
                {icon}
            </div>
            {href && (
                <Link
                    href={href}
                    className="text-sm font-medium transition-colors shrink-0"
                    style={{ color: metaColor }}
                >
                    {seeAllLabel} →
                </Link>
            )}
        </div>
    );
}
