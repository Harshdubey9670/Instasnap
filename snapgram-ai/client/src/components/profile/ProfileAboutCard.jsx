import { Briefcase, MapPin, Calendar } from "lucide-react";

const ACCOUNT_TYPE_LABEL = {
  creator: "Content Creator",
  business: "Business Account",
  personal: "Personal Account",
};

export const ProfileAboutCard = ({ profile }) => {
  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;

  const rows = [
    { icon: Briefcase, text: profile.category || ACCOUNT_TYPE_LABEL[profile.accountType] },
    { icon: MapPin, text: profile.location },
    { icon: Calendar, text: joined ? `Joined ${joined}` : null },
  ].filter((row) => row.text);

  if (rows.length === 0) return null;

  return (
    <div className="warm-card p-4">
      <h3 className="text-sm font-bold text-text-primary mb-3">About</h3>
      <div className="space-y-2.5">
        {rows.map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-center gap-2.5 text-sm text-text-primary">
            <Icon className="w-4 h-4 text-text-secondary shrink-0" />
            <span className="truncate">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
