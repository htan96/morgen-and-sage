type Props = {
  editing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onToggle?: () => void;
  toggleLabel?: string;
};

export default function RowActions({
  editing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onToggle,
  toggleLabel,
}: Props) {
  return (
    <div className="flex justify-end gap-2">
      {editing ? (
        <>
          {onSave && (
            <button onClick={onSave} className="ui-btn ui-btn-save">
              Save
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel} className="ui-btn ui-btn-cancel">
              Cancel
            </button>
          )}
        </>
      ) : (
        <>
          {onEdit && (
            <button onClick={onEdit} className="ui-btn ui-btn-edit">
              Edit
            </button>
          )}

          {onToggle && toggleLabel && (
            <button onClick={onToggle} className="ui-btn ui-btn-edit">
              {toggleLabel}
            </button>
          )}

          {onDelete && (
            <button onClick={onDelete} className="ui-btn ui-btn-delete">
              Delete
            </button>
          )}
        </>
      )}
    </div>
  );
}