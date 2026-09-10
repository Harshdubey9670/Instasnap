import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { X, Check, Plus, LogOut } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { logout } from '../../store/authSlice';

/**
 * AccountSwitcherModal
 * 
 * Web only supports a single account. This modal shows the current user's
 * info and provides login/logout options. 
 * Future: extend saved_accounts in localStorage for multi-account support.
 */
export const AccountSwitcherModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: authUser } = useSelector(state => state.auth);

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(logout());
    onClose();
    navigate('/auth/login');
  };

  const handleAddAccount = () => {
    // Save current session before navigating to login
    // (future multi-account: store current token in saved_accounts)
    onClose();
    navigate('/auth/login');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[360px] bg-bg-base border border-border-soft rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Account switcher"
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-border-strong rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
          <h2 className="font-bold text-text-primary text-base">Accounts</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-bg-surface-hover transition-colors text-text-secondary"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Account */}
        {authUser && (
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Current Account
            </p>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary-500/8 border border-primary-500/20">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-500/40 flex-shrink-0 bg-bg-surface-hover">
                <Avatar
                  src={authUser.profilePicture || authUser.avatar}
                  fallback={authUser.username?.charAt(0)?.toUpperCase()}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary text-sm truncate leading-tight">
                  {authUser.username}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {authUser.fullName || authUser.email || 'Active account'}
                </p>
              </div>
              {/* Active checkmark */}
              <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          {/* Add / Switch Account */}
          <button
            onClick={handleAddAccount}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-border-soft hover:bg-bg-surface-hover transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-primary-500/40 flex items-center justify-center flex-shrink-0 group-hover:border-primary-500 transition-colors">
              <Plus className="w-4 h-4 text-primary-500" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm leading-tight">Add account</p>
              <p className="text-xs text-text-secondary">Log into an existing account</p>
            </div>
          </button>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <p className="font-semibold text-red-400 text-sm">Log out of {authUser?.username}</p>
          </button>
        </div>
      </div>
    </>
  );
};
