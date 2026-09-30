import { useEffect, useMemo, useState } from "react";
import { Download, Eye, MousePointerClick, Globe2, Megaphone, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

type Campaign = {
  campaign_id: string;
  campaign_name: string;
  advertiser_name: string;
  partner_name: string | null;
  pricing_model: string;
  budget: number | null;
  currency: string;
  target_countries: string[];
  start_at: string | null;
  end_at: string | null;
  status: string;
  impressions: number;
  clicks: number;
  completions: number;
  skips: number;
  tracked_value: number;
};

type CountryRow = { country_code: string; impressions: number; clicks: number; unique_users: number };

export function AdminCampaignReports() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [selected, setSelected] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ campaign_name: "", advertiser_name: "", partner_name: "", pricing_model: "impressions", budget: "", currency: "USD", target_countries: "", status: "draft" });

  const load = async () => {
    setLoading(true);
    const [{ data: campaignData }, { data: countryData }] = await Promise.all([
      supabase.from("ad_campaign_report").select("*").order("start_at", { ascending: false }),
      supabase
        .from("ad_events")
        .select("country_code,event_type,user_id")
        .not("country_code", "is", null),
    ]);
    setCampaigns((campaignData ?? []) as Campaign[]);
    const grouped = new Map<string, { impressions: number; clicks: number; users: Set<string> }>();
    for (const row of countryData ?? []) {
      const key = row.country_code || "unknown";
      const item = grouped.get(key) ?? { impressions: 0, clicks: 0, users: new Set<string>() };
      if (row.event_type === "impression") item.impressions++;
      if (row.event_type === "click") item.clicks++;
      if (row.user_id) item.users.add(row.user_id);
      grouped.set(key, item);
    }
    setCountries([...grouped.entries()].map(([country_code, v]) => ({
      country_code, impressions: v.impressions, clicks: v.clicks, unique_users: v.users.size,
    })).sort((a,b) => b.impressions-a.impressions));
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => campaigns.filter(c => {
    const q = search.toLowerCase();
    return (selected === "all" || c.campaign_id === selected) &&
      (!q || c.campaign_name.toLowerCase().includes(q) || c.advertiser_name.toLowerCase().includes(q) || (c.partner_name ?? "").toLowerCase().includes(q));
  }), [campaigns, search, selected]);

  const totals = filtered.reduce((a,c) => ({
    impressions: a.impressions + Number(c.impressions || 0),
    clicks: a.clicks + Number(c.clicks || 0),
    completions: a.completions + Number(c.completions || 0),
  }), { impressions: 0, clicks: 0, completions: 0 });

  const createCampaign = async () => {
    if (!form.campaign_name.trim() || !form.advertiser_name.trim()) return;
    const { error } = await supabase.from("ad_campaigns").insert({
      campaign_name: form.campaign_name.trim(), advertiser_name: form.advertiser_name.trim(), partner_name: form.partner_name.trim() || null,
      pricing_model: form.pricing_model, budget: form.budget ? Number(form.budget) : null, currency: form.currency,
      target_countries: form.target_countries.split(",").map(x => x.trim().toUpperCase()).filter(Boolean), status: form.status,
    });
    if (!error) { setShowCreate(false); setForm({ campaign_name: "", advertiser_name: "", partner_name: "", pricing_model: "impressions", budget: "", currency: "USD", target_countries: "", status: "draft" }); await load(); }
  };

  const exportReport = () => {
    const rows = [
      ["Campaign","Advertiser","Circle Partner","Status","Impressions","Clicks","Completions","Skips","Tracked Value"],
      ...filtered.map(c => [c.campaign_name,c.advertiser_name,c.partner_name ?? "",c.status,c.impressions,c.clicks,c.completions,c.skips,c.tracked_value]),
    ];
    const csv = rows.map(r => r.map(v => JSON.stringify(v ?? "")).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "circle-panda-campaign-report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return <section className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Megaphone className="size-3.5" /> Advertiser Reporting</div>
        <h2 className="mt-1 text-xl font-bold sm:text-2xl">Campaigns &amp; Delivery Reports</h2>
        <p className="mt-1 text-xs text-muted-foreground">A presentation-ready view of campaign delivery, audience reach and Circle Partner performance.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-1.5 size-3.5" />Refresh</Button>
        <Button size="sm" onClick={exportReport}><Download className="mr-1.5 size-3.5" />Export CSV</Button>
      </div>
    </div>

    {showCreate && <div className="rounded-2xl border border-border/80 bg-card p-4">\n      <div className="mb-3 font-semibold">Create advertiser campaign</div>\n      <div className="grid gap-3 sm:grid-cols-2">\n        <Input placeholder="Campaign name" value={form.campaign_name} onChange={e => setForm(f => ({...f,campaign_name:e.target.value}))} />\n        <Input placeholder="Advertiser / brand" value={form.advertiser_name} onChange={e => setForm(f => ({...f,advertiser_name:e.target.value}))} />\n        <Input placeholder="Circle Partner (optional)" value={form.partner_name} onChange={e => setForm(f => ({...f,partner_name:e.target.value}))} />\n        <Input placeholder="Target countries, e.g. NG, GH, KE" value={form.target_countries} onChange={e => setForm(f => ({...f,target_countries:e.target.value}))} />\n        <Input inputMode="decimal" placeholder="Campaign budget" value={form.budget} onChange={e => setForm(f => ({...f,budget:e.target.value}))} />\n        <select value={form.pricing_model} onChange={e => setForm(f => ({...f,pricing_model:e.target.value}))} className="h-10 rounded-md border border-border bg-background px-3 text-sm"><option value="impressions">CPM / Impressions</option><option value="clicks">CPC / Clicks</option><option value="actions">CPA / Actions</option><option value="fixed">Fixed Campaign</option></select>\n      </div>\n      <div className="mt-3 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={() => void createCampaign()}>Create Campaign</Button></div>\n    </div>}\n\n    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        ["Impressions", totals.impressions, Eye],
        ["Clicks", totals.clicks, MousePointerClick],
        ["Completions", totals.completions, Users],
      ].map(([label,value,Icon]) => <div key={String(label)} className="rounded-2xl border border-border/80 bg-card p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{label}</span><Icon className="size-4" /></div>
        <div className="mt-2 text-2xl font-bold">{Number(value).toLocaleString()}</div>
      </div>)}
    </div>

    <div className="flex flex-col gap-2 sm:flex-row">
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaign, brand or Circle Partner" className="sm:max-w-md" />
      <select value={selected} onChange={e => setSelected(e.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
        <option value="all">All campaigns</option>
        {campaigns.map(c => <option key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</option>)}
      </select>
    </div>

    <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
      <table className="w-full min-w-[820px] text-left text-xs">
        <thead className="border-b border-border/70 bg-muted/30 text-muted-foreground"><tr>
          <th className="p-3">Campaign / Brand</th><th className="p-3">Partner</th><th className="p-3">Status</th><th className="p-3">Impressions</th><th className="p-3">Clicks</th><th className="p-3">Completions</th><th className="p-3">Value</th>
        </tr></thead>
        <tbody className="divide-y divide-border/60">
          {filtered.map(c => <tr key={c.campaign_id} className="hover:bg-muted/20">
            <td className="p-3"><div className="font-semibold">{c.campaign_name}</div><div className="text-muted-foreground">{c.advertiser_name}</div></td>
            <td className="p-3">{c.partner_name || "Direct Sponsor"}</td>
            <td className="p-3"><span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{c.status}</span></td>
            <td className="p-3 font-semibold">{Number(c.impressions).toLocaleString()}</td>
            <td className="p-3">{Number(c.clicks).toLocaleString()}</td>
            <td className="p-3">{Number(c.completions).toLocaleString()}</td>
            <td className="p-3">{c.currency} {Number(c.tracked_value || 0).toLocaleString()}</td>
          </tr>)}
          {!loading && filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No campaign records yet. Create/attach campaigns as sponsor deliveries go live.</td></tr>}
        </tbody>
      </table>
    </div>

    <div className="rounded-2xl border border-border/80 bg-card p-4">
      <div className="flex items-center gap-2 font-semibold"><Globe2 className="size-4 text-primary" /> Country delivery</div>
      <p className="mt-1 text-xs text-muted-foreground">Country results use the country captured with each ad event. Older events without a country remain unclassified.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map(c => <div key={c.country_code} className="rounded-xl border border-border/60 p-3">
          <div className="font-semibold">{c.country_code}</div>
          <div className="mt-1 text-xs text-muted-foreground">{c.impressions.toLocaleString()} impressions · {c.clicks.toLocaleString()} clicks · {c.unique_users.toLocaleString()} users</div>
        </div>)}
        {!countries.length && <div className="text-xs text-muted-foreground">Country-level delivery will appear automatically once ad events start recording country codes.</div>}
      </div>
    </div>
  </section>;
}
