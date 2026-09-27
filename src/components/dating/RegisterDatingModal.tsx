import { useEffect, useState } from "react";
import { Heart, LockKeyhole, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStore, type DatingProfile, type SexualExperience } from "@/lib/store";

const EMOJI_AVATARS = ["🐼", "🌙", "✨", "🍫", "🎋", "⛈️", "☀️", "🎨", "🦊", "🐯", "🐨", "🦁"];
const SUGGESTED_INTERESTS = [
  "Books", "Late walks", "Vinyl", "Matcha", "Gaming", "Memes",
  "Baking", "Photography", "Live music", "Coffee", "Night drives", "Art galleries",
];
const GENDERS = ["Woman", "Man", "Non-binary", "Prefer not to say"];
const SEXUALITIES = ["Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Asexual", "Queer", "Prefer not to say"];
const DATING_INTENTS = ["Long-term relationship", "Short-term relationship", "Casual dating", "Marriage", "Still figuring it out"];
const RELATIONSHIP_TYPES = ["Monogamous", "Open relationship", "Polyamorous", "Open to discussing", "Prefer not to say"];
const SEXUAL_EXPERIENCE: SexualExperience[] = [
  "Virgin",
  "Novice",
  "Expert",
  "Good in Bed",
  "Pro",
  "Prefer Not to Say",
];

export function RegisterDatingModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { datingProfile, registerDatingProfile } = useStore();
  const locked = Boolean(datingProfile);

  const [name, setName] = useState(datingProfile?.name ?? "Anonymous Panda");
  const [age, setAge] = useState<number>(datingProfile?.age ?? 24);
  const [emoji, setEmoji] = useState(datingProfile?.emoji ?? "🐼");
  const [location, setLocation] = useState(datingProfile?.location ?? "Lagos");
  const [gender, setGender] = useState(datingProfile?.gender ?? "");
  const [sexuality, setSexuality] = useState(datingProfile?.sexuality ?? "");
  const [datingIntent, setDatingIntent] = useState(datingProfile?.datingIntent ?? "");
  const [relationshipType, setRelationshipType] = useState(datingProfile?.relationshipType ?? "");
  const [sexualExperience, setSexualExperience] = useState<SexualExperience>(
    datingProfile?.sexualExperience ?? "Prefer Not to Say",
  );
  const [vibe, setVibe] = useState(datingProfile?.vibe ?? "");
  const [bio, setBio] = useState(datingProfile?.bio ?? "");
  const [interests, setInterests] = useState<string[]>(
    datingProfile?.interests ?? ["Late walks", "Books", "Matcha"],
  );
  const [likes, setLikes] = useState(datingProfile?.likes?.join(", ") ?? "");
  const [dislikes, setDislikes] = useState(datingProfile?.dislikes?.join(", ") ?? "");
  const [lookingFor, setLookingFor] = useState(datingProfile?.lookingFor?.join(", ") ?? "");
  const [promptOne, setPromptOne] = useState(datingProfile?.promptAnswers?.[0] ?? "");
  const [promptTwo, setPromptTwo] = useState(datingProfile?.promptAnswers?.[1] ?? "");

  useEffect(() => {
    if (!datingProfile) return;
    setName(datingProfile.name);
    setAge(datingProfile.age);
    setEmoji(datingProfile.emoji);
    setLocation(datingProfile.location);
    setGender(datingProfile.gender);
    setSexuality(datingProfile.sexuality);
    setDatingIntent(datingProfile.datingIntent);
    setRelationshipType(datingProfile.relationshipType);
    setSexualExperience(datingProfile.sexualExperience);
    setVibe(datingProfile.vibe);
    setBio(datingProfile.bio);
    setInterests(datingProfile.interests);
    setLikes(datingProfile.likes.join(", "));
    setDislikes(datingProfile.dislikes.join(", "));
    setLookingFor(datingProfile.lookingFor.join(", "));
    setPromptOne(datingProfile.promptAnswers[0] ?? "");
    setPromptTwo(datingProfile.promptAnswers[1] ?? "");
  }, [datingProfile]);

  const toggleInterest = (tag: string) => {
    setInterests((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gender || !sexuality || !datingIntent || !relationshipType) {
      toast.error("Complete the required dating details");
      return;
    }
    if (!bio.trim()) {
      toast.error("Please add a short bio");
      return;
    }

    const split = (value: string) =>
      value.split(",").map((v) => v.trim()).filter(Boolean);

    const profile: Omit<DatingProfile, "registeredAt"> = {
      name: name.trim(),
      age: Number(age) || 24,
      location: location.trim() || "Anonymous",
      emoji,
      gender,
      sexuality,
      datingIntent,
      relationshipType,
      sexualExperience,
      vibe: vibe.trim() || "Mysterious panda",
      bio: bio.trim(),
      interests: interests.length > 0 ? interests : ["Late walks", "Memes"],
      likes: split(likes),
      dislikes: split(dislikes),
      lookingFor: split(lookingFor),
      promptAnswers: [promptOne.trim(), promptTwo.trim()].filter(Boolean),
    };

    registerDatingProfile(profile);

    toast.success(datingProfile ? "Dating profile updated 💗" : "🎉 Registered for Dating!", {
      description: datingProfile
        ? "Your locked registration details remain unchanged."
        : "Username, age and location are now locked to your registration.",
    });
    onOpenChange(false);
  };

  const selectClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--dating)_20%,transparent)] text-[var(--dating)]">
              <Heart className="size-5 fill-current" />
            </span>
            <div>
              <DialogTitle className="font-display text-xl font-bold">
                {datingProfile ? "Your Dating Profile" : "Register for Dating"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {datingProfile
                  ? "Your Panda identity stays tied to registration."
                  : "Your Panda identity, age and location come from registration and cannot be changed here."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <section className="rounded-2xl border border-[var(--dating)]/25 bg-[var(--dating)]/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold">
              <LockKeyhole className="size-4" /> Registration details
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Panda Username</label>
                <Input value={name} disabled={locked} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Age</label>
                <Input type="number" min={18} max={99} value={age} disabled={locked} onChange={(e) => setAge(Number(e.target.value))} />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Registration Location</label>
              <Input value={location} disabled={locked} onChange={(e) => setLocation(e.target.value)} />
            </div>
            {locked ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Username, age and location are permanently tied to your registration details.
              </p>
            ) : null}
          </section>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Panda Avatar</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_AVATARS.map((em) => (
                <button key={em} type="button" onClick={() => setEmoji(em)}
                  className={"grid size-10 place-items-center rounded-xl text-xl transition-all " + (emoji === em ? "bg-[var(--dating)] text-white scale-110 shadow-md ring-2 ring-[var(--dating)]/50" : "bg-secondary/60 hover:bg-secondary text-foreground")}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">Gender *</label><select className={selectClass} value={gender} onChange={(e) => setGender(e.target.value)}><option value="">Select</option>{GENDERS.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">Sexuality *</label><select className={selectClass} value={sexuality} onChange={(e) => setSexuality(e.target.value)}><option value="">Select</option>{SEXUALITIES.map((x) => <option key={x}>{x}</option>)}</select></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">Dating Intention *</label><select className={selectClass} value={datingIntent} onChange={(e) => setDatingIntent(e.target.value)}><option value="">Select</option>{DATING_INTENTS.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">Relationship Type *</label><select className={selectClass} value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)}><option value="">Select</option>{RELATIONSHIP_TYPES.map((x) => <option key={x}>{x}</option>)}</select></div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Sexual Experience</label>
            <select className={selectClass} value={sexualExperience} onChange={(e) => setSexualExperience(e.target.value as SexualExperience)}>
              {SEXUAL_EXPERIENCE.map((x) => <option key={x}>{x}</option>)}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">Optional dating information. Choose “Prefer Not to Say” to keep it private.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Vibe / Tagline</label>
            <Input value={vibe} onChange={(e) => setVibe(e.target.value)} placeholder="e.g. Night owl · matcha lover" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">About You *</label>
            <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell a match what you are like..." required />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Interests</label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_INTERESTS.map((item) => {
                const active = interests.includes(item);
                return <button key={item} type="button" onClick={() => toggleInterest(item)}
                  className={"rounded-full px-3 py-1 text-xs font-medium transition-colors " + (active ? "bg-[var(--dating)] text-white shadow-sm" : "border border-border bg-secondary/60 text-muted-foreground hover:text-foreground")}>{item}</button>;
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">Things I Like</label><Input value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="Humour, music, travel..." /></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">Things I Dislike</label><Input value={dislikes} onChange={(e) => setDislikes(e.target.value)} placeholder="Smoking, dishonesty..." /></div>
            <div><label className="mb-1 block text-xs font-semibold text-muted-foreground">What I'm Looking For</label><Input value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder="Kindness, communication, adventure..." /></div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-muted-foreground">Profile Prompts</label>
            <Input value={promptOne} onChange={(e) => setPromptOne(e.target.value)} placeholder="My ideal first date is..." />
            <Input value={promptTwo} onChange={(e) => setPromptTwo(e.target.value)} placeholder="A green flag about me is..." />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="gap-1.5 bg-[var(--dating)] text-[var(--dating-foreground)] hover:bg-[var(--dating)]/90 font-bold">
              <Sparkles className="size-4" /> {datingProfile ? "Save Profile" : "Complete Registration"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
