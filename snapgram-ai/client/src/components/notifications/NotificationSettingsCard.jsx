import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Bell, ChevronRight } from "lucide-react";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";

const CompactToggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-medium text-text-primary">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-label={`Toggle ${label}`}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
        checked ? "bg-primary-500" : "bg-bg-surface-hover border border-border-soft"
      }`}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 mt-0.5 transform rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  </div>
);

export const NotificationSettingsCard = () => {
  const { settings } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleUpdate = async (type, key, value) => {
    const updates = { notifications: { [type]: { ...settings?.notifications?.[type], [key]: value } } };
    dispatch(optimisticUpdateSetting(updates));
    try {
      await dispatch(updateSettings(updates)).unwrap();
    } catch {
      toast({ variant: "error", title: "Error", description: "Failed to update notification settings" });
    }
  };

  return (
    <div className="warm-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary-500" /> Notification Settings
        </h3>
      </div>

      <div className="divide-y divide-border-soft">
        <CompactToggle
          label="Push Notifications"
          checked={settings?.notifications?.push?.newFollowers ?? true}
          onChange={(val) => {
            handleUpdate("push", "likes", val);
            handleUpdate("push", "comments", val);
            handleUpdate("push", "mentions", val);
            handleUpdate("push", "newFollowers", val);
          }}
        />
        <CompactToggle
          label="Email Updates"
          checked={settings?.notifications?.email?.news ?? true}
          onChange={(val) => handleUpdate("email", "news", val)}
        />
      </div>

      <Link
        to="/app/settings"
        className="flex items-center justify-between mt-3 pt-3 border-t border-border-soft text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
      >
        All notification settings
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};
