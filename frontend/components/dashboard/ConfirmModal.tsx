interface ConfirmModalProps {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  id,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <dialog id={id} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4">{message}</p>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-ghost" disabled={isLoading}>
              {cancelText}
            </button>
          </form>
          <button
            className="btn btn-error"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <span className="loading loading-spinner loading-sm"></span>}
            {confirmText}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
