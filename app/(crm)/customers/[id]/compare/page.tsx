import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { UNIT_TYPE_LABELS } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatInr } from "@/lib/format";

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const customer = await db.customer.findUnique({ where: { id }, include: { requirements: { include: { matches: { where: { status: "SHORTLISTED" }, include: { unit: { include: { tower: { include: { project: { include: { developer: true } } } } } } } } } } } });
  if (!customer) notFound();
  const matches = customer.requirements.flatMap((requirement) => requirement.matches);
  return <div className="space-y-6"><PageHeader eyebrow="Shortlist" title={`Compare for ${customer.name}`} description="Persistent shortlisted inventory across this customer’s requirements." />{matches.length === 0 ? <Card className="p-5 text-sm text-muted-foreground">No shortlisted units yet.</Card> : <Card className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-4">Project</th><th className="p-4">Unit</th><th className="p-4">Configuration</th><th className="p-4">Carpet</th><th className="p-4">Price</th><th className="p-4">Possession</th><th className="p-4">Amenities</th></tr></thead><tbody className="divide-y divide-border">{matches.map((match) => <tr key={match.id}><td className="p-4"><p className="font-medium">{match.unit.tower.project.name}</p><p className="text-xs text-muted-foreground">{match.unit.tower.project.developer.name} · {match.unit.tower.project.locality}</p></td><td className="p-4">{match.unit.tower.name} {match.unit.number} · floor {match.unit.floor}</td><td className="p-4">{UNIT_TYPE_LABELS[match.unit.type]}</td><td className="p-4">{match.unit.carpetSqft} sqft</td><td className="p-4 font-mono">{formatInr(match.unit.price)}</td><td className="p-4">{match.unit.tower.project.possession ?? "—"}</td><td className="p-4">{match.unit.tower.project.amenities ?? "—"}</td></tr>)}</tbody></table></Card>}</div>;
}
