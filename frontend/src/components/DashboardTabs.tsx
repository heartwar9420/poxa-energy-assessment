import React, { useState, useEffect, useRef } from 'react';

interface DashboardItem {
  id: string;
  name: string;
}

interface DashboardTabsProps {
  dashboards: DashboardItem[];
  currentDbId: string | null;
  newDbName: string;
  onSelectDashboard: (id: string) => void;
  onNewDbNameChange: (name: string) => void;
  onCreateDashboard: (e: React.FormEvent<HTMLFormElement>) => void;
  editingDbId: string | null;
  onStartRename: (id: string) => void;
  onCancelRename: () => void;
  onSaveRename: (id: string, newName: string) => Promise<boolean>;
  isCreating?: boolean;
  isRenaming?: boolean;
}

interface EditableTabProps {
  initialName: string;
  isRenaming: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
}

function EditableTab({ initialName, isRenaming, onSave, onCancel }: EditableTabProps) {
  const [localEditName, setLocalEditName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = () => {
    if (isRenaming) return;
    onSave(localEditName);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-50 border border-gray-300 px-2 py-1 rounded-lg">
      <input
        ref={inputRef}
        type="text"
        value={localEditName}
        disabled={isRenaming}
        onChange={(e) => setLocalEditName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        className="bg-white border border-gray-200 text-sm font-medium px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-30 max-w-50 text-gray-900"
      />
      <button
        type="button"
        disabled={isRenaming}
        onClick={handleSave}
        className="text-xs text-green-600 hover:text-green-700 font-bold px-1 disabled:opacity-50"
      >
        ✓
      </button>
      <button
        type="button"
        disabled={isRenaming}
        onClick={onCancel}
        className="text-xs text-gray-400 hover:text-gray-600 font-bold px-1 disabled:opacity-50"
      >
        ✕
      </button>
    </div>
  );
}

export default function DashboardTabs({
  dashboards,
  currentDbId,
  newDbName,
  onSelectDashboard,
  onNewDbNameChange,
  onCreateDashboard,
  editingDbId,
  onStartRename,
  onCancelRename,
  onSaveRename,
  isCreating = false,
  isRenaming = false,
}: DashboardTabsProps) {
  const handleRenameSubmit = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return onCancelRename();

    const success = await onSaveRename(id, trimmed);
    if (success) {
      onCancelRename();
    }
  };

  const baseTabClass =
    'px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap pr-8 relative group flex items-center';
  const selectedTabClass = 'bg-blue-600/30 text-white shadow';
  const defaultTabClass = 'bg-gray-100 text-gray-600 hover:bg-gray-200';

  return (
    <div className="bg-white p-4 rounded-xl shadow border border-gray-100 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 max-w-full">
        {dashboards.map((db) => {
          const isSelected = currentDbId === db.id;
          const isEditingThis = editingDbId === db.id;

          if (isEditingThis) {
            return (
              <EditableTab
                key={db.id}
                initialName={db.name}
                isRenaming={isRenaming}
                onSave={(newName) => handleRenameSubmit(db.id, newName)}
                onCancel={onCancelRename}
              />
            );
          }

          return (
            <div key={db.id} className={baseTabClass}>
              <button
                type="button"
                onClick={() => onSelectDashboard(db.id)}
                className={`w-full h-full absolute inset-0 rounded-lg ${isSelected ? selectedTabClass : defaultTabClass}`}
                style={{ zIndex: 0 }}
              />

              <span className="relative z-10 pointer-events-none">{db.name}</span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartRename(db.id);
                }}
                className={`absolute right-2 z-10 text-xs p-0.5 rounded transition-opacity opacity-100 md:opacity-0 group-hover:opacity-100 ${
                  isSelected
                    ? 'text-blue-200 hover:text-white hover:bg-blue-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-300'
                }`}
                title="重命名"
              >
                ✎
              </button>
            </div>
          );
        })}
      </div>

      <form onSubmit={onCreateDashboard} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="新增監控場域 (如: 綠岩監控)..."
          value={newDbName}
          onChange={(e) => onNewDbNameChange(e.target.value)}
          disabled={isCreating}
          className={`p-2 border border-gray-300 rounded-lg text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 text-sm w-52 transition-colors ${
            isCreating ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''
          }`}
        />
        <button
          type="button"
          disabled={isCreating}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow ${
            isCreating
              ? 'bg-gray-400 text-gray-100 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-gray-900 text-white'
          }`}
        >
          {isCreating ? '建立中...' : '+ 建立'}
        </button>
      </form>
    </div>
  );
}
