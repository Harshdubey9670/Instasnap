import { useSelector, useDispatch } from "react-redux";
import { updateSettings, optimisticUpdateSetting } from "../../store/authSlice";
import { useToast } from "../ui/Toast";
import { SettingToggle } from "./SettingToggle";
import { SettingSelect } from "./SettingSelect";
import { Users, UserX, UserMinus, BellOff, ChevronRight, Download } from "lucide-react";

/**
 * PrivacySettings — Phase T updated
 *
 * Changes vs previous version:
 *  - Replaced hideFollowers / hideFollowing boolean toggles with
 *    followersListVisibility / followingListVisibility enum selects.
 *  - Added "Downloads" section for allowStoryDownloads / allowReelDownloads.
 *
 * Backend enforcement note:
 *  These settings are enforced server-side by the privacy guard functions.
 *  Changing the UI does NOT bypass backend checks.
 */

const FOLLOWER_VISIBILITY_OPTIONS = [
  { value: 'public',    label: 'Everyone' },
  { value: 'followers', label: 'My followers' },
  { value: 'following', label: 'People I follow' },
  { value: 'private',   label: 'Only me' },
];

const PrivacySettings = () => {
  const { settings } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const handleUpdate = async (category, key, value) => {
    const updates = { [category]: { [key]: value } };
    dispatch(optimisticUpdateSetting(updates));
    
    try {
      await dispatch(updateSettings(updates)).unwrap();
    } catch (error) {
      toast({ variant: "error", title: "Error", description: "Failed to update setting" });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold hero-text mb-2">Privacy &amp; Safety</h2>
        <p className="text-text-secondary">Control who can see your content and interact with you.</p>
      </div>

      {/* ── Account Privacy ─────────────────────────────────────────────────── */}
      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Account Privacy</h3>
        
        <SettingToggle 
          label="Private Account" 
          description="Only approved followers can see your posts and stories."
          checked={settings?.privacy?.isPrivate || false}
          onChange={(val) => handleUpdate('privacy', 'isPrivate', val)}
        />
        
        <SettingToggle 
          label="Activity Status" 
          description="Allow accounts you follow to see when you were last active."
          checked={settings?.privacy?.activityStatus || false}
          onChange={(val) => handleUpdate('privacy', 'activityStatus', val)}
        />
        
        <SettingToggle 
          label="Read Receipts" 
          description="Let people know when you've read their messages."
          checked={settings?.privacy?.readReceipts ?? true}
          onChange={(val) => handleUpdate('privacy', 'readReceipts', val)}
        />
      </div>

      {/* ── Followers & Following Visibility (Phase T) ───────────────────────── */}
      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2" id="followers-following-visibility">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">
          Followers &amp; Following Visibility
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Control who can open your followers and following lists. Follower/following counts remain visible on your profile.
        </p>

        <SettingSelect
          label="Followers list"
          description="Choose who can see the list of people who follow you."
          value={settings?.privacy?.followersListVisibility || 'public'}
          options={FOLLOWER_VISIBILITY_OPTIONS}
          onChange={(val) => handleUpdate('privacy', 'followersListVisibility', val)}
        />

        <SettingSelect
          label="Following list"
          description="Choose who can see the list of people you follow."
          value={settings?.privacy?.followingListVisibility || 'public'}
          options={FOLLOWER_VISIBILITY_OPTIONS}
          onChange={(val) => handleUpdate('privacy', 'followingListVisibility', val)}
        />
      </div>

      {/* ── Downloads (Phase T) ─────────────────────────────────────────────── */}
      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2" id="downloads">
        <div className="flex items-center gap-2 border-b border-border-soft pb-2 mb-4">
          <Download className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-bold text-text-primary">Downloads</h3>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          Control whether other people can download your content. You can also set this per post when creating content.
        </p>

        <SettingToggle 
          label="Allow people to download my Stories"
          description="When enabled, viewers can save your stories to their device."
          checked={settings?.privacy?.allowStoryDownloads ?? true}
          onChange={(val) => handleUpdate('privacy', 'allowStoryDownloads', val)}
        />

        <SettingToggle 
          label="Allow people to download my Reels"
          description="When enabled, viewers can save your reels to their device."
          checked={settings?.privacy?.allowReelDownloads ?? true}
          onChange={(val) => handleUpdate('privacy', 'allowReelDownloads', val)}
        />
      </div>

      {/* ── Manage Connections ───────────────────────────────────────────────── */}
      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Manage Connections</h3>
        
        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Close Friends</p>
              <p className="text-sm text-text-secondary">Share stories with a select group</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>

        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Blocked Users</p>
              <p className="text-sm text-text-secondary">Manage blocked accounts</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>

        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Restricted Users</p>
              <p className="text-sm text-text-secondary">Limit interactions without blocking</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>

        <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-surface-hover transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
              <BellOff className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Muted Users</p>
              <p className="text-sm text-text-secondary">Hide posts and stories</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* ── Interactions ─────────────────────────────────────────────────────── */}
      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Interactions</h3>
        
        <SettingSelect
          label="Who Can Message You"
          description="Choose who can send you direct messages."
          value={settings?.privacy?.whoCanMessage || 'everyone'}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'following', label: 'People you follow' },
            { value: 'nobody', label: 'Nobody' }
          ]}
          onChange={(val) => handleUpdate('privacy', 'whoCanMessage', val)}
        />

        <SettingSelect
          label="Story Privacy"
          description="Choose who can see your stories."
          value={settings?.privacy?.storyPrivacy || 'everyone'}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'following', label: 'People you follow' },
            { value: 'closeFriends', label: 'Close Friends Only' }
          ]}
          onChange={(val) => handleUpdate('privacy', 'storyPrivacy', val)}
        />

        <SettingSelect
          label="Story Replies"
          description="Choose who can reply to your stories."
          value={settings?.privacy?.storyReplies || 'everyone'}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'following', label: 'People you follow' },
            { value: 'nobody', label: 'Nobody' }
          ]}
          onChange={(val) => handleUpdate('privacy', 'storyReplies', val)}
        />
        
        <SettingSelect
          label="Tags &amp; Mentions"
          description="Choose who can tag or mention you in posts and comments."
          value={settings?.privacy?.whoCanTag || 'everyone'}
          options={[
            { value: 'everyone', label: 'Everyone' },
            { value: 'following', label: 'People you follow' },
            { value: 'nobody', label: 'Nobody' }
          ]}
          onChange={(val) => handleUpdate('privacy', 'whoCanTag', val)}
        />
      </div>

      {/* ── Safety Filters ───────────────────────────────────────────────────── */}
      <div className="bg-bg-surface border border-border-soft rounded-2xl p-4 sm:p-6 shadow-sm space-y-2">
        <h3 className="text-lg font-bold text-text-primary border-b border-border-soft pb-2 mb-4">Safety Filters</h3>
        
        <SettingToggle 
          label="Filter Offensive Comments" 
          description="Automatically hide comments that may be offensive."
          checked={settings?.privacy?.filterOffensiveComments ?? true}
          onChange={(val) => handleUpdate('privacy', 'filterOffensiveComments', val)}
        />
      </div>
    </div>
  );
};

export default PrivacySettings;
