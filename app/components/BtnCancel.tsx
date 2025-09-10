import Link from "next/link";

export default function BtnCancel({
  label,
  href,
  noArrow = false,
}: {
  label?: string;
  href: string;
  noArrow?: boolean;
}) {
  return (
    <Link className="btn btn-ghost btn-secondary" href={href}>
      {noArrow ? null : "←"} {label || "Cancel"}
    </Link>
  );
}
